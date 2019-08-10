/**
 * 处理 import '../../src/browser/style.less'
 * 期望 import './style.less'
 * 兼容老方法
 */

const fs = require('fs')
const { join, relative } = require('path')

// 检查是否是 packages 中的资源
const RE_PKG = /\/packages\/.+?\/lib\//

const RE_STYLE = /\.css|\.less$/

/**
 * 将路径 /xxx/packages/xxx/lib => /xxx/packages/xxx/src
 * @param request
 * @returns {string}
 */
function handle (request) {
  return request.replace(RE_PKG, (a) => a.replace('lib', 'src'));
}


class StyleFallbackPlugin {
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap('StyleFallbackPlugin', compilation => {
      compilation.hooks.beforeResolve.tap('StyleFallbackPlugin', result => {
        const { context, request } = result;

        // 不处理
        // - 非点开头的
        // - 非 .less 或者 .css 结尾的
        // - node_modules 下的资源
        // - 非 packages 文件夹下资源
        if (!request.startsWith('.') || 
            !RE_STYLE.test(request) || 
            /node_modules/.test(context) ||
            !RE_PKG.test(context)
        ) {
          return result;
        }

        // 只处理样式文件
        const target = join(context, request);

        // 探测该样式文件能否查找到
        try {
          fs.statSync(target)
        } catch (err) {
          if (err.code === 'ENOENT') {
            // 不能查找到
            // 替换处理 lib => src
            const newRequest = handle(target);
            result.request = relative(context, newRequest);
          }
        }

        return result;
      })
    })
  }
}

module.exports = StyleFallbackPlugin
