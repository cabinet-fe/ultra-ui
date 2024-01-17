// vite.config.ts
import { defineConfig } from "file:///E:/project/ultra-ui/node_modules/.pnpm/vite@5.0.10_@types+node@20.10.6_sass@1.69.7/node_modules/vite/dist/node/index.js";
import Vue from "file:///E:/project/ultra-ui/node_modules/.pnpm/@vitejs+plugin-vue@5.0.2_vite@5.0.10_vue@3.4.3/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import VueJSX from "file:///E:/project/ultra-ui/node_modules/.pnpm/@vitejs+plugin-vue-jsx@3.1.0_vite@5.0.10_vue@3.4.3/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import Components from "file:///E:/project/ultra-ui/node_modules/.pnpm/unplugin-vue-components@0.25.2_vue@3.4.3/node_modules/unplugin-vue-components/dist/vite.mjs";
import autoprefixer from "file:///E:/project/ultra-ui/node_modules/.pnpm/autoprefixer@10.4.16_postcss@8.4.32/node_modules/autoprefixer/lib/autoprefixer.js";
import { UIResolver } from "file:///E:/project/ultra-ui/vite-helper/resolver.js";
var vite_config_default = defineConfig(() => {
  return {
    base: "/",
    resolve: {
      extensions: [".ts", ".js", ".json", ".tsx"]
    },
    plugins: [
      Vue({
        script: {
          defineModel: true
        }
      }),
      VueJSX(),
      Components({
        resolvers: [UIResolver],
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
      host: true
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxwcm9qZWN0XFxcXHVsdHJhLXVpXFxcXHNhbXBsZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxccHJvamVjdFxcXFx1bHRyYS11aVxcXFxzYW1wbGVcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L3Byb2plY3QvdWx0cmEtdWkvc2FtcGxlL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IFZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXHJcbmltcG9ydCBWdWVKU1ggZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlLWpzeCdcclxuaW1wb3J0IENvbXBvbmVudHMgZnJvbSAndW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvdml0ZSdcclxuaW1wb3J0IGF1dG9wcmVmaXhlciBmcm9tICdhdXRvcHJlZml4ZXInXHJcbmltcG9ydCB7IFVJUmVzb2x2ZXIgfSBmcm9tICd2aXRlLWhlbHBlci9yZXNvbHZlcidcclxuXHJcbi8vIGNvbnN0IGNvbXBvbmVudHMgPSBuZXcgU2V0KFtcclxuXHJcbi8vIF0pXHJcblxyXG4vLyBmdW5jdGlvbiBVSVJlc29sdmVyKGNvbXBvbmVudE5hbWU6IHN0cmluZykge1xyXG5cclxuLy8gICBjb25zdCBrZWJOYW1lID0ga2ViYWJDYXNlKGNvbXBvbmVudE5hbWUuc2xpY2UoMSkpXHJcbi8vICAgaWYgKGNvbXBvbmVudE5hbWUuc3RhcnRzV2l0aCgnVScpKSB7XHJcbi8vICAgICByZXR1cm4ge1xyXG4vLyAgICAgICBuYW1lOiBjb21wb25lbnROYW1lLFxyXG4vLyAgICAgICBmcm9tOiAndWx0cmEtdWknLFxyXG4vLyAgICAgICBzaWRlRWZmZWN0czogYEB1aS9jb21wb25lbnRzLyR7a2ViTmFtZX0vc3R5bGVgXHJcbi8vICAgICB9XHJcbi8vICAgfVxyXG4vLyB9XHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoKSA9PiB7XHJcbiAgcmV0dXJuIHtcclxuICAgIGJhc2U6ICcvJyxcclxuXHJcbiAgICByZXNvbHZlOiB7XHJcbiAgICAgIGV4dGVuc2lvbnM6IFsnLnRzJywgJy5qcycsICcuanNvbicsICcudHN4J11cclxuICAgIH0sXHJcblxyXG4gICAgcGx1Z2luczogW1xyXG4gICAgICBWdWUoe1xyXG4gICAgICAgIHNjcmlwdDoge1xyXG4gICAgICAgICAgZGVmaW5lTW9kZWw6IHRydWVcclxuICAgICAgICB9XHJcbiAgICAgIH0pLFxyXG4gICAgICBWdWVKU1goKSxcclxuICAgICAgQ29tcG9uZW50cyh7XHJcbiAgICAgICAgcmVzb2x2ZXJzOiBbVUlSZXNvbHZlcl0sXHJcbiAgICAgICAgZHRzOiB0cnVlLFxyXG4gICAgICAgIGluY2x1ZGU6IFsvXFwudnVlJC9dXHJcbiAgICAgIH0pXHJcbiAgICBdLFxyXG5cclxuICAgIGNzczoge1xyXG4gICAgICBwb3N0Y3NzOiB7XHJcbiAgICAgICAgcGx1Z2luczogW1xyXG4gICAgICAgICAgYXV0b3ByZWZpeGVyKHtcclxuICAgICAgICAgICAgb3ZlcnJpZGVCcm93c2Vyc2xpc3Q6IFtcclxuICAgICAgICAgICAgICBcImllID49IDExXCIsXHJcbiAgICAgICAgICAgICAgXCJjaHJvbWUgPj0gNTBcIixcclxuICAgICAgICAgICAgICBcImZpcmVmb3ggPj0gNDBcIixcclxuICAgICAgICAgICAgICBcInNhZmFyaSA+PSAxMFwiLFxyXG4gICAgICAgICAgICAgIFwiZWRnZSA+PSAxM1wiLFxyXG4gICAgICAgICAgICAgIFwiaW9zID49IDEwXCIsXHJcbiAgICAgICAgICAgICAgXCJhbmRyb2lkID49IDVcIlxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgICB9KSBhcyBhbnlcclxuICAgICAgICBdXHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgIHBvcnQ6IDc3ODgsXHJcbiAgICAgIGhvc3Q6IHRydWVcclxuICAgIH1cclxuICB9XHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBd1EsU0FBUyxvQkFBb0I7QUFDclMsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sWUFBWTtBQUNuQixPQUFPLGdCQUFnQjtBQUN2QixPQUFPLGtCQUFrQjtBQUN6QixTQUFTLGtCQUFrQjtBQWlCM0IsSUFBTyxzQkFBUSxhQUFhLE1BQU07QUFDaEMsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBRU4sU0FBUztBQUFBLE1BQ1AsWUFBWSxDQUFDLE9BQU8sT0FBTyxTQUFTLE1BQU07QUFBQSxJQUM1QztBQUFBLElBRUEsU0FBUztBQUFBLE1BQ1AsSUFBSTtBQUFBLFFBQ0YsUUFBUTtBQUFBLFVBQ04sYUFBYTtBQUFBLFFBQ2Y7QUFBQSxNQUNGLENBQUM7QUFBQSxNQUNELE9BQU87QUFBQSxNQUNQLFdBQVc7QUFBQSxRQUNULFdBQVcsQ0FBQyxVQUFVO0FBQUEsUUFDdEIsS0FBSztBQUFBLFFBQ0wsU0FBUyxDQUFDLFFBQVE7QUFBQSxNQUNwQixDQUFDO0FBQUEsSUFDSDtBQUFBLElBRUEsS0FBSztBQUFBLE1BQ0gsU0FBUztBQUFBLFFBQ1AsU0FBUztBQUFBLFVBQ1AsYUFBYTtBQUFBLFlBQ1gsc0JBQXNCO0FBQUEsY0FDcEI7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLGNBQ0E7QUFBQSxZQUNGO0FBQUEsVUFDRixDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFFQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsSUFDUjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
