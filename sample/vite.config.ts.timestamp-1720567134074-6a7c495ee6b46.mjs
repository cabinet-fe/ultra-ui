// vite.config.ts
import { defineConfig } from "file:///E:/project/ultra-ui/node_modules/.pnpm/vite@5.3.3_@types+node@20.14.2_sass@1.77.6/node_modules/vite/dist/node/index.js";
import Vue from "file:///E:/project/ultra-ui/node_modules/.pnpm/@vitejs+plugin-vue@5.0.5_vite@5.3.3_vue@3.4.31/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import VueJSX from "file:///E:/project/ultra-ui/node_modules/.pnpm/@vitejs+plugin-vue-jsx@4.0.0_vite@5.3.3_vue@3.4.31/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import Components from "file:///E:/project/ultra-ui/node_modules/.pnpm/unplugin-vue-components@0.27.2_rollup@4.18.0_vue@3.4.31/node_modules/unplugin-vue-components/dist/vite.js";
import autoprefixer from "file:///E:/project/ultra-ui/node_modules/.pnpm/autoprefixer@10.4.19_postcss@8.4.39/node_modules/autoprefixer/lib/autoprefixer.js";
import { UltraUIResolver } from "file:///E:/project/ultra-ui/vite-helper/resolver.js";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
var __vite_injected_original_import_meta_url = "file:///E:/project/ultra-ui/sample/vite.config.ts";
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
        resolvers: [UltraUIResolver],
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxwcm9qZWN0XFxcXHVsdHJhLXVpXFxcXHNhbXBsZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxccHJvamVjdFxcXFx1bHRyYS11aVxcXFxzYW1wbGVcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L3Byb2plY3QvdWx0cmEtdWkvc2FtcGxlL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IFZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXHJcbmltcG9ydCBWdWVKU1ggZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlLWpzeCdcclxuaW1wb3J0IENvbXBvbmVudHMgZnJvbSAndW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvdml0ZSdcclxuaW1wb3J0IGF1dG9wcmVmaXhlciBmcm9tICdhdXRvcHJlZml4ZXInXHJcbmltcG9ydCB7IFVsdHJhVUlSZXNvbHZlciB9IGZyb20gJ3ZpdGUtaGVscGVyL3Jlc29sdmVyJ1xyXG5pbXBvcnQgeyBkaXJuYW1lLCByZXNvbHZlIH0gZnJvbSAncGF0aCdcclxuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCdcclxuXHJcbmNvbnN0IF9fZGlybmFtZSA9IGRpcm5hbWUoZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpKVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCgpID0+IHtcclxuICByZXR1cm4ge1xyXG4gICAgYmFzZTogJy8nLFxyXG5cclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgZXh0ZW5zaW9uczogWycudHMnLCAnLmpzJywgJy5qc29uJywgJy50c3gnXSxcclxuICAgICAgYWxpYXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmaW5kOiAvXnVsdHJhLXVpJC8sXHJcbiAgICAgICAgICByZXBsYWNlbWVudDogcmVzb2x2ZShfX2Rpcm5hbWUsICcuLi91aS9pbmRleC50cycpXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmaW5kOiAvXnVsdHJhLXVpXFwvKC4qKSQvLFxyXG4gICAgICAgICAgcmVwbGFjZW1lbnQ6IHJlc29sdmUoX19kaXJuYW1lLCBgLi4vdWkvJDFgKVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHsgZmluZDogL15AdWlcXC8oLiopJC8sIHJlcGxhY2VtZW50OiByZXNvbHZlKF9fZGlybmFtZSwgYC4uL3VpLyQxYCkgfVxyXG4gICAgICBdXHJcbiAgICB9LFxyXG5cclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgVnVlKCksXHJcbiAgICAgIFZ1ZUpTWCgpLFxyXG4gICAgICBDb21wb25lbnRzKHtcclxuICAgICAgICByZXNvbHZlcnM6IFtVbHRyYVVJUmVzb2x2ZXJdLFxyXG4gICAgICAgIGR0czogdHJ1ZSxcclxuICAgICAgICBpbmNsdWRlOiBbL1xcLnZ1ZSQvXVxyXG4gICAgICB9KVxyXG4gICAgXSxcclxuXHJcbiAgICBjc3M6IHtcclxuICAgICAgcG9zdGNzczoge1xyXG4gICAgICAgIHBsdWdpbnM6IFtcclxuICAgICAgICAgIGF1dG9wcmVmaXhlcih7XHJcbiAgICAgICAgICAgIG92ZXJyaWRlQnJvd3NlcnNsaXN0OiBbXHJcbiAgICAgICAgICAgICAgJ2llID49IDExJyxcclxuICAgICAgICAgICAgICAnY2hyb21lID49IDUwJyxcclxuICAgICAgICAgICAgICAnZmlyZWZveCA+PSA0MCcsXHJcbiAgICAgICAgICAgICAgJ3NhZmFyaSA+PSAxMCcsXHJcbiAgICAgICAgICAgICAgJ2VkZ2UgPj0gMTMnLFxyXG4gICAgICAgICAgICAgICdpb3MgPj0gMTAnLFxyXG4gICAgICAgICAgICAgICdhbmRyb2lkID49IDUnXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICAgIH0pIGFzIGFueVxyXG4gICAgICAgIF1cclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgcG9ydDogNzc4OCxcclxuICAgICAgaG9zdDogdHJ1ZSxcclxuICAgICAgaG1yOiB0cnVlXHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXdRLFNBQVMsb0JBQW9CO0FBQ3JTLE9BQU8sU0FBUztBQUNoQixPQUFPLFlBQVk7QUFDbkIsT0FBTyxnQkFBZ0I7QUFDdkIsT0FBTyxrQkFBa0I7QUFDekIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxTQUFTLGVBQWU7QUFDakMsU0FBUyxxQkFBcUI7QUFQcUksSUFBTSwyQ0FBMkM7QUFTcE4sSUFBTSxZQUFZLFFBQVEsY0FBYyx3Q0FBZSxDQUFDO0FBRXhELElBQU8sc0JBQVEsYUFBYSxNQUFNO0FBQ2hDLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUVOLFNBQVM7QUFBQSxNQUNQLFlBQVksQ0FBQyxPQUFPLE9BQU8sU0FBUyxNQUFNO0FBQUEsTUFDMUMsT0FBTztBQUFBLFFBQ0w7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLGFBQWEsUUFBUSxXQUFXLGdCQUFnQjtBQUFBLFFBQ2xEO0FBQUEsUUFDQTtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sYUFBYSxRQUFRLFdBQVcsVUFBVTtBQUFBLFFBQzVDO0FBQUEsUUFFQSxFQUFFLE1BQU0sZUFBZSxhQUFhLFFBQVEsV0FBVyxVQUFVLEVBQUU7QUFBQSxNQUNyRTtBQUFBLElBQ0Y7QUFBQSxJQUVBLFNBQVM7QUFBQSxNQUNQLElBQUk7QUFBQSxNQUNKLE9BQU87QUFBQSxNQUNQLFdBQVc7QUFBQSxRQUNULFdBQVcsQ0FBQyxlQUFlO0FBQUEsUUFDM0IsS0FBSztBQUFBLFFBQ0wsU0FBUyxDQUFDLFFBQVE7QUFBQSxNQUNwQixDQUFDO0FBQUEsSUFDSDtBQUFBLElBRUEsS0FBSztBQUFBLE1BQ0gsU0FBUztBQUFBLFFBQ1AsU0FBUztBQUFBLFVBQ1AsYUFBYTtBQUFBLFlBQ1gsc0JBQXNCO0FBQUEsY0FDcEI7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLGNBQ0E7QUFBQSxZQUNGO0FBQUEsVUFDRixDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFFQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixLQUFLO0FBQUEsSUFDUDtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
