/* eslint-disable no-await-in-loop */
import webpack from 'webpack';
import kebabCase from 'lodash/kebabCase';
import { GojiBasedWebpackPlugin } from './based';
import { usedComponentsMap } from '../shared';

const GOJI_CORE_PACKAGE_NAME = '@goji/core';

// hard code string in Webpack
// https://github.com/webpack/webpack/blob/8d5ad83b3274029e37386dbd5d0c64d8102bcd6f/lib/dependencies/HarmonyImportSpecifierDependency.js#L36
const HARMONY_IMPORT_SPECIFIER_DEPENDENCY_TYPE: webpack.Stats.ReasonType =
  'harmony import specifier';
// https://github.com/webpack/webpack/blob/8d5ad83b3274029e37386dbd5d0c64d8102bcd6f/lib/dependencies/CommonJsRequireDependency.js#L16
const COMMON_JS_REQUIRE_DEPENDENCY_TYPE: webpack.Stats.ReasonType = 'cjs require';

interface WebpackCompilationDependency {
  type: webpack.Stats.ReasonType;
  request: string;
  name: string;
  id: string | null;
}

interface WebpackCompilationModule {
  type: string;
  resource: string;
  dependencies: Array<WebpackCompilationDependency>;
}

const isUpperCase = (char: string) => char.toUpperCase() === char;

/*
 * 1. filter component-like name, e.g. CoverView
 * 2. convert it to kebab case, e.g. CoverView => cover-view
 */
const formatUsedComponents = (names: Array<string>): Array<string> => {
  return names.filter(name => isUpperCase(name[0])).map(name => kebabCase(name));
};

/**
 * collect used component by analyzing Webpack dependency tree for GojiBridgeWebpackPlugin
 * for example, if use `import { View, Button, Image } from '@goji/core'`
 * GojiJS should output only <view>, <button> and <image> in bridge files
 */
export class GojiCollectUsedComponentsWebpackPlugin extends GojiBasedWebpackPlugin {
  public apply(compiler: webpack.Compiler) {
    compiler.hooks.thisCompilation.tap('GojiCollectUsedComponentsWebpackPlugin', compilation => {
      // should use `afterChunks` which run before `optimize` because `optimize` break original dependencies
      // @ts-ignore
      compilation.hooks.afterChunks.tap('GojiCollectUsedComponentsWebpackPlugin', () => {
        const collectDependencyOfGojiCore = (
          modules: Array<WebpackCompilationModule>,
        ): Array<string> | undefined => {
          const dependencyNamesSet = new Set<string>();
          for (const module of modules) {
            if (module.type.startsWith('javascript/')) {
              for (const dependency of module.dependencies) {
                // only process `@goji/core`
                if (dependency.request !== GOJI_CORE_PACKAGE_NAME) {
                  continue;
                }
                switch (dependency.type) {
                  case COMMON_JS_REQUIRE_DEPENDENCY_TYPE: {
                    compilation.warnings.push(
                      new Error(
                        `[GojiCollectUsedComponentsWebpackPlugin] \nGojiJS strongly recommend to use ES module in ${module.resource} otherwise the bridge file size optimization was disabled`,
                      ),
                    );
                    return undefined;
                  }
                  case HARMONY_IMPORT_SPECIFIER_DEPENDENCY_TYPE: {
                    // `dependency.id` would be `null` if this is a namespace import, which means `import * as xx from 'yy'`
                    // see https://github.com/webpack/webpack/blob/8d5ad83b3274029e37386dbd5d0c64d8102bcd6f/lib/Parser.js#L1210
                    if (!dependency.id) {
                      compilation.warnings.push(
                        new Error(
                          `[GojiCollectUsedComponentsWebpackPlugin] \nShould not use \`import * as ${dependency.name} from '@goji/core'\` in ${module.resource}`,
                        ),
                      );
                      return undefined;
                    }
                    dependencyNamesSet.add(dependency.id);
                    break;
                  }
                  default:
                    break;
                }
              }
            }
          }

          return Array.from(dependencyNamesSet);
        };
        const dependencyNames = collectDependencyOfGojiCore(compilation.modules);
        usedComponentsMap.set(
          compilation,
          dependencyNames ? formatUsedComponents(dependencyNames) : undefined,
        );
      });
    });
  }
}
