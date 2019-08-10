import * as lsp from 'vscode-languageserver';
// import { BindRegion } from './recore-ls-service';

export function isBuildinCtrlMethodsOrProps(item: any) {
  if (item.label && typeof item.label === 'string') {
    return item.label.startsWith('$');
  }
  return true;
}

export function genLSPParams(uri: string, position: lsp.Position): lsp.CompletionParams | lsp.TextDocumentPositionParams {
  return {
    textDocument: {
      uri: fixUri(uri, 'file')
    },
    position
  };
}

/* 
  1. schema = 'file' example: file:///Users/admin/proj/hello-recore/src/app.ts
  2. schema = 'none' example: /Users/admin/proj/hello-recore/src/app.ts
 */
export function fixUri(uri: string, scheme: string = 'file') {
  const regFile = /^(file:\/\/\/)(\w|\/)+/;
  const regNone = /^\/(\w|\/)+/;
  switch (scheme) {
    case 'file':
      if (regFile.test(uri)) {
        return uri;
      } else if (regNone.test(uri)) {
        return 'file://' + uri;
      }
    case 'none':
      if (regNone.test(uri)) {
        return uri;
      } else if (regFile.test(uri)) {
        return uri.replace('file://', '');
      } else {
        throw (`The format of URI:'${uri}' is wrong.`);
      }
    default:
      throw (`Unknown scheme of URI '${uri}'`);
  }
}

/* 
  数据类型为number/string/boolean/array/any的返回true
 */
export function isBasicDataType(detail: string, isIncludeArray: boolean) {
  if (!detail) {
    return true;
  }

  // 不分析controller和helpers里的数组
  if (isIncludeArray && detail.endsWith('[]')) {
    return true;
  }

  /\(property\) \S+: (.+)/.test(detail);
  const type = RegExp.$1;
  if (!type) {
    return true;
  }
  const BASIC_DATA_TYPES = ['number', 'string', 'boolean', 'any'];
  return BASIC_DATA_TYPES.some(item => item === type);
}

// export function isContext(region: string) {
//   return region !== BindRegion.Controller && region !== BindRegion.Utils;
// }

// export function getHelpersFromBootstrap(ast: any) {
//   const methods: string[] = [];
//   const body = ast.program.body;
//   if (!body.length) {
//     return null;
//   }

//   const ExpressionStatement = body.filter((node: any) => node.type === 'ExpressionStatement').shift();
//   const runAppArgs = _.get(ExpressionStatement, ['expression', 'arguments'], []).shift();
//   const runAppProps = _.get(runAppArgs, 'properties', []);
//   assignHelpers(runAppProps, methods, 'globalHelpers');
//   return methods;
// }

// export function getHelpersFromCtrl(ast: any) {
//   const body = ast.program.body;
//   if (!body.length) {
//     return null;
//   }

//   const exportDefaultDeclaration = body.filter((node: any) => node.type === 'ExportDefaultDeclaration').shift();

//   const exportDefaultBody = _.get(exportDefaultDeclaration, ['declaration', 'body']);
//   if (exportDefaultBody) { // 优先分析默认导出类
//     return parseClass(exportDefaultDeclaration.declaration);
//   } else { // 分析默认导出指针同名类
//     const exportDefaultName = _.get(exportDefaultDeclaration, ['declaration', 'name'], '');
//     const classDeclarations = body.filter((node: any) => node.type === 'ClassDeclaration');
//     const classDeclaration = classDeclarations.filter((cls: any) => {
//       const name = _.get(cls, ['id', 'name'], '');
//       return name === exportDefaultName;
//     }).shift();
//     return parseClass(classDeclaration);
//   }
// }

// function parseClass(declaration: any) {
//   if (!declaration) {
//     return null;
//   }

//   const decorators = _.get(declaration, ['decorators'], []);
//   const helpers: string[] = [];
//   // 解析@inject
//   const decorator = decorators.shift();
//   const decoratorName = _.get(decorator, ['expression', 'callee', 'name'], '');
//   const decoratorArgs = _.get(decorator, ['expression', 'arguments'], []).shift();
//   const decoratorProps = _.get(decoratorArgs, 'properties', []);
//   if (decoratorName === 'inject' && decoratorProps.length) {
//     assignHelpers(decoratorProps, helpers, 'helpers');
//   }
// }

// function assignHelpers(source: any[], helpers: string[], key: string) {
//   source.forEach((item: any) => {
//     const name = _.get(item, ['key', 'name'], '');
//     const props = _.get(item, ['value', 'properties'], []);
//     if (!props.length) {
//       return;
//     }
//     props.forEach((prop: any) => {
//       const injectProp = _.get(prop, ['key', 'name'], '');
//       if (!injectProp) {
//         return;
//       }
//       if (name === key) {
//         helpers.push(injectProp);
//       }
//     });
//   });
// }