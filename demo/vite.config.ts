import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function domInspectorBabelPlugin(babel: any) {
  const t = babel.types;
  return {
    name: 'dom-inspector-react-instrumentation',
    visitor: {
      Program(path: any, state: any) {
        let hasTrackingImport = false;

        path.node.body.forEach((node: any) => {
          if (t.isImportDeclaration(node) && node.source.value.includes('/src/runtime/reactTracking')) {
            hasTrackingImport = true;
          }
        });

        if (!hasTrackingImport) {
          path.unshiftContainer(
            'body',
            t.importDeclaration(
              [
                t.importSpecifier(t.identifier('trackedUseState'), t.identifier('trackedUseState')),
                t.importSpecifier(t.identifier('trackedUseReducer'), t.identifier('trackedUseReducer')),
                t.importSpecifier(t.identifier('trackComponentRender'), t.identifier('trackComponentRender')),
              ],
              t.stringLiteral('../../src/runtime/reactTracking.ts')
            )
          );
        }
      },
      FunctionDeclaration(path: any, state: any) {
        const name = path.node.id?.name;
        if (!name || name[0] !== name[0].toUpperCase() || !path.node.body?.body) return;

        const file = state.file.opts.filename ?? 'unknown';
        path.node.body.body.unshift(
          t.expressionStatement(
            t.callExpression(t.identifier('trackComponentRender'), [t.stringLiteral(name), t.stringLiteral(file)])
          )
        );
      },
      VariableDeclarator(path: any, state: any) {
        if (!t.isArrayPattern(path.node.id)) return;
        if (!t.isCallExpression(path.node.init) || !t.isIdentifier(path.node.init.callee)) return;

        const callee = path.node.init.callee.name;
        const file = state.file.opts.filename ?? 'unknown';
        const componentPath = path.getFunctionParent();
        const componentName = componentPath?.node && (componentPath.node.id?.name || componentPath.parentPath?.node?.id?.name) || 'UnknownComponent';
        const firstId = path.node.id.elements[0];
        if (!firstId || !t.isIdentifier(firstId)) return;

        if (callee === 'useState') {
          path.node.init.callee = t.identifier('trackedUseState');
          path.node.init.arguments = [
            t.stringLiteral(componentName),
            t.stringLiteral(file),
            t.stringLiteral(firstId.name),
            ...path.node.init.arguments,
          ];
        }

        if (callee === 'useReducer') {
          path.node.init.callee = t.identifier('trackedUseReducer');
          path.node.init.arguments = [
            t.stringLiteral(componentName),
            t.stringLiteral(file),
            t.stringLiteral(firstId.name),
            ...path.node.init.arguments,
          ];
        }
      },
    },
  };
}

export default defineConfig({
  root: __dirname,
  plugins: [
    react({
      babel: {
        plugins: [domInspectorBabelPlugin],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
