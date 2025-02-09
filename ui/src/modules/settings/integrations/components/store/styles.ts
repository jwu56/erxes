import { colors, dimensions } from 'modules/common/styles';
import { rgba } from 'modules/common/styles/color';
import { Contents } from 'modules/layout/styles';
import styled from 'styled-components';
import styledTS from 'styled-components-ts';

const collapsibleBackground = '#f8f8f8';

const IntegrationWrapper = styled.div`
  padding-bottom: ${dimensions.coreSpacing * 1.5}px;
  flex: 1;
  min-width: 1000px;
  background: ${colors.colorWhite};
  z-index: 1;
`;

const IntegrationRow = styled.div`
  padding-right: ${dimensions.coreSpacing}px;
  display: flex;
  flex-wrap: wrap;
  background: ${colors.colorWhite};

  &:last-of-type {
    margin-bottom: 20px;
  }
`;

const Box = styledTS<{ isInMessenger: boolean }>(styled.div)`
  padding: 30px;
  padding-bottom: ${props => props.isInMessenger && '20px'};
  border: 1px solid ${colors.borderPrimary};
  border-radius: 2px;
  flex: 1;
  transition: all ease 0.3s;
  position: relative;

  &:hover {
    cursor: pointer;
    border-color: ${colors.colorCoreTeal};
  }
`;

const Ribbon = styled.div`
  overflow: hidden;
  position: absolute;
  right: -5px;
  top: -5px;
  width: 100px;
  height: 100px;

  span {
    position: absolute;
    width: 130px;
    color: ${colors.colorWhite};
    font-size: ${dimensions.unitSpacing}px;
    font-weight: bold;
    text-transform: uppercase;
    text-align: center;
    line-height: ${dimensions.coreSpacing + 5}px;
    transform: rotate(45deg);
    background: linear-gradient(
      ${colors.colorPrimary} 0%,
      ${colors.colorSecondary} 100%
    );
    box-shadow: 0 3px 10px -5px rgba(0, 0, 0, 1);
    top: 25px;
    right: -27px;

    &:before {
      content: '';
      position: absolute;
      left: 0px;
      top: 100%;
      border-left: 3px solid ${colors.colorPrimary};
      border-right: 3px solid transparent;
      border-bottom: 3px solid transparent;
      border-top: 3px solid ${colors.colorPrimary};
    }

    &:after {
      content: '';
      position: absolute;
      right: 0px;
      top: 100%;
      border-left: 3px solid transparent;
      border-right: 3px solid ${colors.colorPrimary};
      border-bottom: 3px solid transparent;
      border-top: 3px solid ${colors.colorPrimary};
    }
  }
`;

const Type = styled.span`
  display: block;
  color: ${colors.colorCoreGray};
  padding-top: ${dimensions.coreSpacing - 5}px;
`;

const IntegrationItem = styled.div`
  width: 25%;
  display: flex;
  padding-left: ${dimensions.coreSpacing}px;
  padding-top: ${dimensions.coreSpacing}px;
  position: relative;

  img {
    width: 48px;
    height: 48px;
    object-fit: contain;
  }

  h5 {
    margin-top: ${dimensions.coreSpacing}px;

    span {
      font-size: 80%;
      color: ${colors.colorCoreGray};
    }

    > i {
      color: ${colors.colorCoreGray};
      margin-left: 5px;
    }
  }

  p {
    margin: 0;
  }

  > a,
  button {
    font-weight: 500;
    font-size: 15px;
    color: ${colors.linkPrimary};
    position: absolute;
    right: 30px;
    top: 55px;
    cursor: pointer;
    background: none;
    outline: 0;
    border: none;

    :hover {
      text-decoration: underline;
      opacity: 0.9;
    }
  }

  &.active {
    ${Box} {
      border-color: ${colors.colorCoreTeal};
      box-shadow: 0 2px 15px 0 ${rgba(colors.colorCoreDarkGray, 0.1)};
    }

    &::before {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      margin-left: -10px;
      border-left: ${dimensions.coreSpacing}px solid transparent;
      border-right: ${dimensions.coreSpacing}px solid transparent;
      border-bottom: ${dimensions.coreSpacing}px solid #e8e8e8;
    }
  }

  @media (max-width: 1400px) {
    padding-left: ${dimensions.coreSpacing}px;
    padding-top: ${dimensions.coreSpacing}px;
  }
`;

const CollapsibleContent = styled.div`
  margin: ${dimensions.coreSpacing}px 0 0 ${dimensions.coreSpacing}px;
  padding: 10px 40px 20px 10px;
  background: ${collapsibleBackground};
  box-shadow: inset 10px 11px 5px -10px ${colors.colorShadowGray},
    inset 11px -11px 5px -10px ${colors.colorShadowGray};

  img {
    width: 300px;
    padding: 40px 0 20px;
  }

  table thead th {
    background: none;
    position: inherit;
    z-index: 0;
  }

  table td {
    background: none;
  }

  &:last-of-type {
    margin-bottom: 20px;
  }
`;

const Content = styled(Contents)`
  padding-left: ${dimensions.unitSpacing}px;
`;

const SearchInput = styledTS<{ isInPopover: boolean }>(styled.div)`
  position: relative;

  input {
    border: 1px solid ${colors.borderPrimary};
    padding: 20px 20px 20px 30px;
    border-radius: 5px;
    width: ${props => (props.isInPopover ? '250px' : '500px')};
    margin:  ${props => props.isInPopover && '5px 5px 0'};
    background: ${colors.colorWhite};

    @media (max-width: 1300px) {
      min-width: 260px;
    }
  }

  i {
    position: absolute;
    top: 10px;
    left: 10px;
    font-size: 15px;
    color: ${colors.colorCoreGray};
  }
`;

const FullHeight = styled.div`
  height: 100%;
`;

export {
  IntegrationWrapper,
  IntegrationRow,
  IntegrationItem,
  CollapsibleContent,
  Box,
  Type,
  Content,
  SearchInput,
  Ribbon,
  FullHeight
};
