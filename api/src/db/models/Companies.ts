import { Model, model } from 'mongoose';
import { ACTIVITY_LOG_ACTIONS, putActivityLog } from '../../data/logUtils';
import { validSearchText } from '../../data/utils';
import { Conformities, Fields, InternalNotes } from './';
import { ICustomField } from './definitions/common';
import {
  companySchema,
  ICompany,
  ICompanyDocument
} from './definitions/companies';
import { ACTIVITY_CONTENT_TYPES } from './definitions/constants';
import { IUserDocument } from './definitions/users';

export interface ICompanyModel extends Model<ICompanyDocument> {
  getCompanyName(company: ICompany): string;

  checkDuplication(
    companyFields: {
      primaryName?: string;
      code?: string;
    },
    idsToExclude?: string[] | string
  ): never;

  fillSearchText(doc: ICompany): string;

  findActiveCompanies(selector, fields?): Promise<ICompanyDocument[]>;
  getCompany(_id: string): Promise<ICompanyDocument>;

  createCompany(doc: ICompany, user?: IUserDocument): Promise<ICompanyDocument>;

  updateCompany(_id: string, doc: ICompany): Promise<ICompanyDocument>;

  removeCompanies(_ids: string[]): Promise<{ n: number; ok: number }>;

  mergeCompanies(
    companyIds: string[],
    companyFields: ICompany
  ): Promise<ICompanyDocument>;

  bulkInsert(
    fieldNames: string[],
    fieldValues: string[][],
    user: IUserDocument
  ): Promise<string[]>;
}

export const loadClass = () => {
  class Company {
    /**
     * Checking if company has duplicated unique properties
     */
    public static async checkDuplication(
      companyFields: {
        primaryName?: string;
        code?: string;
      },
      idsToExclude?: string[] | string
    ) {
      const query: { status: {}; [key: string]: any } = {
        status: { $ne: 'deleted' }
      };
      let previousEntry;

      // Adding exclude operator to the query
      if (idsToExclude) {
        query._id = { $nin: idsToExclude };
      }

      if (companyFields.primaryName) {
        // check duplication from primaryName
        previousEntry = await Companies.find({
          ...query,
          primaryName: companyFields.primaryName
        });

        if (previousEntry.length > 0) {
          throw new Error('Duplicated name');
        }
      }

      if (companyFields.code) {
        // check duplication from code
        previousEntry = await Companies.find({
          ...query,
          code: companyFields.code
        });

        if (previousEntry.length > 0) {
          throw new Error('Duplicated code');
        }
      }
    }

    public static fillSearchText(doc: ICompany) {
      return validSearchText([
        (doc.names || []).join(' '),
        (doc.emails || []).join(' '),
        (doc.phones || []).join(' '),
        doc.website || '',
        doc.industry || '',
        doc.plan || '',
        doc.description || '',
        doc.code || ''
      ]);
    }

    public static getCompanyName(company: ICompany) {
      return (
        company.primaryName ||
        company.primaryEmail ||
        company.primaryPhone ||
        'Unknown'
      );
    }

    public static companyFieldNames() {
      const names: string[] = [];

      companySchema.eachPath(name => {
        names.push(name);

        const path = companySchema.paths[name];

        if (path.schema) {
          path.schema.eachPath(subName => {
            names.push(`${name}.${subName}`);
          });
        }
      });

      return names;
    }

    public static fixListFields(
      doc: any,
      trackedData: any[] = [],
      company?: ICompanyDocument
    ) {
      let emails: string[] = doc.emails || [];
      let phones: string[] = doc.phones || [];
      let names: string[] = doc.names || [];

      // extract basic fields from customData
      for (const name of this.companyFieldNames()) {
        trackedData = trackedData.filter(e => e.field !== name);
      }

      trackedData = trackedData.filter(e => e.field !== 'name');

      doc.trackedData = trackedData;

      if (company) {
        emails = Array.from(new Set([...(company.emails || []), ...emails]));
        phones = Array.from(new Set([...(company.phones || []), ...phones]));
        names = Array.from(new Set([...(company.names || []), ...names]));
      }

      if (doc.email) {
        if (!emails.includes(doc.email)) {
          emails.push(doc.email);
        }

        doc.primaryEmail = doc.email;

        delete doc.email;
      }

      if (doc.phone) {
        if (!phones.includes(doc.phone)) {
          phones.push(doc.phone);
        }

        doc.primaryPhone = doc.phone;

        delete doc.phone;
      }

      if (doc.name) {
        if (!names.includes(doc.name)) {
          names.push(doc.name);
        }

        delete doc.name;
      }

      doc.emails = emails;
      doc.phones = phones;
      doc.names = names;

      return doc;
    }

    public static async findActiveCompanies(selector, fields) {
      return Companies.find(
        { ...selector, status: { $ne: 'deleted' } },
        fields
      );
    }

    /**
     * Retreives company
     */
    public static async getCompany(_id: string) {
      const company = await Companies.findOne({ _id });

      if (!company) {
        throw new Error('Company not found');
      }

      return company;
    }

    /**
     * Create a company
     */
    public static async createCompany(doc: ICompany, user: IUserDocument) {
      // Checking duplicated fields of company
      await Companies.checkDuplication(doc);

      if (!doc.ownerId && user) {
        doc.ownerId = user._id;
      }

      this.fixListFields(doc, doc.trackedData);

      // clean custom field values
      doc.customFieldsData = await Fields.prepareCustomFieldsData(
        doc.customFieldsData
      );

      const company = await Companies.create({
        ...doc,
        createdAt: new Date(),
        modifiedAt: new Date(),
        searchText: Companies.fillSearchText(doc)
      });

      // create log
      await putActivityLog({
        action: ACTIVITY_LOG_ACTIONS.CREATE_COC_LOG,
        data: { coc: company, contentType: 'company' }
      });

      return company;
    }

    /**
     * Update company
     */
    public static async updateCompany(_id: string, doc: ICompany) {
      // Checking duplicated fields of company
      await Companies.checkDuplication(doc, [_id]);

      const company = await Companies.getCompany(_id);

      this.fixListFields(doc, doc.trackedData, company);

      // clean custom field values
      if (doc.customFieldsData) {
        doc.customFieldsData = await Fields.prepareCustomFieldsData(
          doc.customFieldsData
        );
      }

      const searchText = Companies.fillSearchText(
        Object.assign(await Companies.getCompany(_id), doc) as ICompany
      );

      await Companies.updateOne(
        { _id },
        { $set: { ...doc, searchText, modifiedAt: new Date() } }
      );

      return Companies.findOne({ _id });
    }

    /**
     * Remove company
     */
    public static async removeCompanies(companyIds: string[]) {
      // Removing modules associated with company
      await putActivityLog({
        action: ACTIVITY_LOG_ACTIONS.REMOVE_ACTIVITY_LOGS,
        data: { type: ACTIVITY_CONTENT_TYPES.COMPANY, itemIds: companyIds }
      });

      await InternalNotes.removeInternalNotes(
        ACTIVITY_CONTENT_TYPES.COMPANY,
        companyIds
      );

      await Conformities.removeConformities({
        mainType: 'company',
        mainTypeIds: companyIds
      });

      return Companies.deleteMany({ _id: { $in: companyIds } });
    }

    /**
     * Merge companies
     */
    public static async mergeCompanies(
      companyIds: string[],
      companyFields: ICompany
    ) {
      // Checking duplicated fields of company
      await this.checkDuplication(companyFields, companyIds);

      let scopeBrandIds: string[] = [];
      let customFieldsData: ICustomField[] = [];
      let tagIds: string[] = [];
      let names: string[] = [];
      let emails: string[] = [];
      let phones: string[] = [];

      // Merging company tags
      for (const companyId of companyIds) {
        const companyObj = await Companies.getCompany(companyId);

        const companyTags = companyObj.tagIds || [];
        const companyNames = companyObj.names || [];
        const companyEmails = companyObj.emails || [];
        const companyPhones = companyObj.phones || [];
        const companyScopeBrandIds = companyObj.scopeBrandIds || [];

        // Merging scopeBrandIds
        scopeBrandIds = scopeBrandIds.concat(companyScopeBrandIds);

        // merge custom fields data
        customFieldsData = [
          ...customFieldsData,
          ...(companyObj.customFieldsData || [])
        ];

        // Merging company's tag into 1 array
        tagIds = tagIds.concat(companyTags);

        // Merging company names
        names = names.concat(companyNames);

        // Merging company emails
        emails = emails.concat(companyEmails);

        // Merging company phones
        phones = phones.concat(companyPhones);

        companyObj.status = 'deleted';

        await Companies.findByIdAndUpdate(companyId, {
          $set: { status: 'deleted' }
        });
      }

      // Removing Duplicates
      tagIds = Array.from(new Set(tagIds));
      names = Array.from(new Set(names));
      emails = Array.from(new Set(emails));
      phones = Array.from(new Set(phones));

      // Creating company with properties
      const company = await Companies.createCompany({
        ...companyFields,
        scopeBrandIds,
        customFieldsData,
        tagIds,
        mergedIds: companyIds,
        names,
        emails,
        phones
      });

      // Updating customer companies, deals, tasks, tickets
      await Conformities.changeConformity({
        type: 'company',
        newTypeId: company._id,
        oldTypeIds: companyIds
      });

      // Removing modules associated with current companies
      await InternalNotes.changeCompany(company._id, companyIds);

      return company;
    }
  }

  companySchema.loadClass(Company);

  return companySchema;
};

loadClass();

// tslint:disable-next-line
const Companies = model<ICompanyDocument, ICompanyModel>(
  'companies',
  companySchema
);

export default Companies;
