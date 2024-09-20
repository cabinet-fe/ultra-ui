// vite.config.ts
import { defineConfig } from "file:///D:/Codes/ultra-ui/node_modules/vite/dist/node/index.js";
import Vue from "file:///D:/Codes/ultra-ui/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import VueJSX from "file:///D:/Codes/ultra-ui/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import Components from "file:///D:/Codes/ultra-ui/node_modules/unplugin-vue-components/dist/vite.js";
import autoprefixer from "file:///D:/Codes/ultra-ui/node_modules/autoprefixer/lib/autoprefixer.js";
import { autoResolveComponent } from "file:///D:/Codes/ultra-ui/node_modules/vite-helper/index.js";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { existModule } from "file:///D:/Codes/ultra-ui/node_modules/cat-kit/es/be/index.js";
var __vite_injected_original_import_meta_url = "file:///D:/Codes/ultra-ui/sample/vite.config.ts";
var __dirname = dirname(fileURLToPath(__vite_injected_original_import_meta_url));
var vite_config_default = defineConfig(() => {
  return {
    base: "/",
    resolve: {
      extensions: [".ts", ".js", ".json", ".tsx"],
      alias: [
        {
          find: /^ultra-ui$/,
          replacement: resolve(__dirname, "../ui/index.ts")
        },
        {
          find: /^ultra-ui\/(.*)$/,
          replacement: resolve(__dirname, `../ui/$1`)
        },
        { find: /^@ui\/(.*)$/, replacement: resolve(__dirname, `../ui/$1`) }
      ]
    },
    plugins: [
      Vue(),
      VueJSX(),
      Components({
        resolvers: [
          autoResolveComponent({
            prefix: "U",
            lib: "ultra-ui",
            sideEffects(kebabName, lib) {
              let moduleId = `${lib}/components/${kebabName}/style.ts`;
              while (!existModule(moduleId)) {
                const preKebabName = kebabName;
                kebabName = kebabName.replace(/-[a-z]$/, "");
                if (preKebabName === kebabName) return;
                moduleId = `${lib}/components/${kebabName}/style.ts`;
              }
              return moduleId;
            }
          })
        ],
        dts: true,
        include: [/\.vue$/]
      })
    ],
    css: {
      postcss: {
        plugins: [
          autoprefixer({
            overrideBrowserslist: [
              "ie >= 11",
              "chrome >= 50",
              "firefox >= 40",
              "safari >= 10",
              "edge >= 13",
              "ios >= 10",
              "android >= 5"
            ]
          })
        ]
      }
    },
    server: {
      port: 7788,
      host: true,
      hmr: true
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxDb2Rlc1xcXFx1bHRyYS11aVxcXFxzYW1wbGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXENvZGVzXFxcXHVsdHJhLXVpXFxcXHNhbXBsZVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovQ29kZXMvdWx0cmEtdWkvc2FtcGxlL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IFZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXHJcbmltcG9ydCBWdWVKU1ggZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlLWpzeCdcclxuaW1wb3J0IENvbXBvbmVudHMgZnJvbSAndW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvdml0ZSdcclxuaW1wb3J0IGF1dG9wcmVmaXhlciBmcm9tICdhdXRvcHJlZml4ZXInXHJcbmltcG9ydCB7IGF1dG9SZXNvbHZlQ29tcG9uZW50IH0gZnJvbSAndml0ZS1oZWxwZXInXHJcbmltcG9ydCB7IGRpcm5hbWUsIHJlc29sdmUgfSBmcm9tICdwYXRoJ1xyXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAndXJsJ1xyXG5pbXBvcnQgeyBleGlzdE1vZHVsZSB9IGZyb20gJ2NhdC1raXQvYmUnXHJcblxyXG5jb25zdCBfX2Rpcm5hbWUgPSBkaXJuYW1lKGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKSlcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoKSA9PiB7XHJcbiAgcmV0dXJuIHtcclxuICAgIGJhc2U6ICcvJyxcclxuXHJcbiAgICByZXNvbHZlOiB7XHJcbiAgICAgIGV4dGVuc2lvbnM6IFsnLnRzJywgJy5qcycsICcuanNvbicsICcudHN4J10sXHJcbiAgICAgIGFsaWFzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgZmluZDogL151bHRyYS11aSQvLFxyXG4gICAgICAgICAgcmVwbGFjZW1lbnQ6IHJlc29sdmUoX19kaXJuYW1lLCAnLi4vdWkvaW5kZXgudHMnKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgZmluZDogL151bHRyYS11aVxcLyguKikkLyxcclxuICAgICAgICAgIHJlcGxhY2VtZW50OiByZXNvbHZlKF9fZGlybmFtZSwgYC4uL3VpLyQxYClcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB7IGZpbmQ6IC9eQHVpXFwvKC4qKSQvLCByZXBsYWNlbWVudDogcmVzb2x2ZShfX2Rpcm5hbWUsIGAuLi91aS8kMWApIH1cclxuICAgICAgXVxyXG4gICAgfSxcclxuXHJcbiAgICBwbHVnaW5zOiBbXHJcbiAgICAgIFZ1ZSgpLFxyXG4gICAgICBWdWVKU1goKSxcclxuICAgICAgQ29tcG9uZW50cyh7XHJcbiAgICAgICAgcmVzb2x2ZXJzOiBbXHJcbiAgICAgICAgICBhdXRvUmVzb2x2ZUNvbXBvbmVudCh7XHJcbiAgICAgICAgICAgIHByZWZpeDogJ1UnLFxyXG4gICAgICAgICAgICBsaWI6ICd1bHRyYS11aScsXHJcbiAgICAgICAgICAgIHNpZGVFZmZlY3RzKGtlYmFiTmFtZSwgbGliKSB7XHJcbiAgICAgICAgICAgICAgbGV0IG1vZHVsZUlkID0gYCR7bGlifS9jb21wb25lbnRzLyR7a2ViYWJOYW1lfS9zdHlsZS50c2BcclxuXHJcbiAgICAgICAgICAgICAgd2hpbGUgKCFleGlzdE1vZHVsZShtb2R1bGVJZCkpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHByZUtlYmFiTmFtZSA9IGtlYmFiTmFtZVxyXG4gICAgICAgICAgICAgICAga2ViYWJOYW1lID0ga2ViYWJOYW1lLnJlcGxhY2UoLy1bYS16XSQvLCAnJylcclxuICAgICAgICAgICAgICAgIGlmIChwcmVLZWJhYk5hbWUgPT09IGtlYmFiTmFtZSkgcmV0dXJuXHJcbiAgICAgICAgICAgICAgICBtb2R1bGVJZCA9IGAke2xpYn0vY29tcG9uZW50cy8ke2tlYmFiTmFtZX0vc3R5bGUudHNgXHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICByZXR1cm4gbW9kdWxlSWRcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICBdLFxyXG4gICAgICAgIGR0czogdHJ1ZSxcclxuICAgICAgICBpbmNsdWRlOiBbL1xcLnZ1ZSQvXVxyXG4gICAgICB9KVxyXG4gICAgXSxcclxuXHJcbiAgICBjc3M6IHtcclxuICAgICAgcG9zdGNzczoge1xyXG4gICAgICAgIHBsdWdpbnM6IFtcclxuICAgICAgICAgIGF1dG9wcmVmaXhlcih7XHJcbiAgICAgICAgICAgIG92ZXJyaWRlQnJvd3NlcnNsaXN0OiBbXHJcbiAgICAgICAgICAgICAgJ2llID49IDExJyxcclxuICAgICAgICAgICAgICAnY2hyb21lID49IDUwJyxcclxuICAgICAgICAgICAgICAnZmlyZWZveCA+PSA0MCcsXHJcbiAgICAgICAgICAgICAgJ3NhZmFyaSA+PSAxMCcsXHJcbiAgICAgICAgICAgICAgJ2VkZ2UgPj0gMTMnLFxyXG4gICAgICAgICAgICAgICdpb3MgPj0gMTAnLFxyXG4gICAgICAgICAgICAgICdhbmRyb2lkID49IDUnXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICAgIH0pIGFzIGFueVxyXG4gICAgICAgIF1cclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgcG9ydDogNzc4OCxcclxuICAgICAgaG9zdDogdHJ1ZSxcclxuICAgICAgaG1yOiB0cnVlXHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWtRLFNBQVMsb0JBQW9CO0FBQy9SLE9BQU8sU0FBUztBQUNoQixPQUFPLFlBQVk7QUFDbkIsT0FBTyxnQkFBZ0I7QUFDdkIsT0FBTyxrQkFBa0I7QUFDekIsU0FBUyw0QkFBNEI7QUFDckMsU0FBUyxTQUFTLGVBQWU7QUFDakMsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxtQkFBbUI7QUFSbUksSUFBTSwyQ0FBMkM7QUFVaE4sSUFBTSxZQUFZLFFBQVEsY0FBYyx3Q0FBZSxDQUFDO0FBRXhELElBQU8sc0JBQVEsYUFBYSxNQUFNO0FBQ2hDLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUVOLFNBQVM7QUFBQSxNQUNQLFlBQVksQ0FBQyxPQUFPLE9BQU8sU0FBUyxNQUFNO0FBQUEsTUFDMUMsT0FBTztBQUFBLFFBQ0w7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLGFBQWEsUUFBUSxXQUFXLGdCQUFnQjtBQUFBLFFBQ2xEO0FBQUEsUUFDQTtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sYUFBYSxRQUFRLFdBQVcsVUFBVTtBQUFBLFFBQzVDO0FBQUEsUUFFQSxFQUFFLE1BQU0sZUFBZSxhQUFhLFFBQVEsV0FBVyxVQUFVLEVBQUU7QUFBQSxNQUNyRTtBQUFBLElBQ0Y7QUFBQSxJQUVBLFNBQVM7QUFBQSxNQUNQLElBQUk7QUFBQSxNQUNKLE9BQU87QUFBQSxNQUNQLFdBQVc7QUFBQSxRQUNULFdBQVc7QUFBQSxVQUNULHFCQUFxQjtBQUFBLFlBQ25CLFFBQVE7QUFBQSxZQUNSLEtBQUs7QUFBQSxZQUNMLFlBQVksV0FBVyxLQUFLO0FBQzFCLGtCQUFJLFdBQVcsR0FBRyxHQUFHLGVBQWUsU0FBUztBQUU3QyxxQkFBTyxDQUFDLFlBQVksUUFBUSxHQUFHO0FBQzdCLHNCQUFNLGVBQWU7QUFDckIsNEJBQVksVUFBVSxRQUFRLFdBQVcsRUFBRTtBQUMzQyxvQkFBSSxpQkFBaUIsVUFBVztBQUNoQywyQkFBVyxHQUFHLEdBQUcsZUFBZSxTQUFTO0FBQUEsY0FDM0M7QUFFQSxxQkFBTztBQUFBLFlBQ1Q7QUFBQSxVQUNGLENBQUM7QUFBQSxRQUNIO0FBQUEsUUFDQSxLQUFLO0FBQUEsUUFDTCxTQUFTLENBQUMsUUFBUTtBQUFBLE1BQ3BCLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFFQSxLQUFLO0FBQUEsTUFDSCxTQUFTO0FBQUEsUUFDUCxTQUFTO0FBQUEsVUFDUCxhQUFhO0FBQUEsWUFDWCxzQkFBc0I7QUFBQSxjQUNwQjtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLFlBQ0Y7QUFBQSxVQUNGLENBQUM7QUFBQSxRQUNIO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUVBLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLEtBQUs7QUFBQSxJQUNQO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
