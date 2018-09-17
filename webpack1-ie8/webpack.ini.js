const { NODE_ENV, PKG_CSS, DIR_SVC, IE_SHIM } = process.env;
const path = require("path");
const pkg = require("./package.json");
const isProd = NODE_ENV === "production";
const ver = isProd ? ".[hash:5]" : "-" + pkg.version;
const min = isProd ? ".min" : "";
const ts = Date.now();
const rel = path.relative.bind(path);
const dir = path.join.bind(path, __dirname);
const dst = array => array ? [...new Set(array)] : [];
const fmt = (f, app) => f instanceof Function ? f(app) : f;

const bootcdn = "https://cdn.bootcss.com/"; // 资源旧下载快
const delivr = "https://cdn.jsdelivr.net/"; // 不能下载字体
const elecdn = "https://npm.elemecdn.com/"; // 资源路径模糊
// 路径常量请尽可能以`/`结尾 webpackConfig.output.publicPath
const publicPath = undefined;
const prefixAjax = undefined;
const buildFolder = "build";
const outputFolder = "dist";
const staticFolder = "src/static";
const templateFolder = "src/views";

// webpack1对于非字符串形式的loader报莫名其妙错误
// webpack1打包样式css压缩对于less文件有效,但是css文件莫名失败
let opts = { sourceMap: !isProd };
const styleLoader = "style-loader?" + JSON.stringify(opts);
// https://github.com/webpack-contrib/style-loader#options
opts = {
	url: false,
	modules: false,
	minimize: isProd,
	sourceMap: !isProd,
};
const cssStyleLoader = "css-loader?" + JSON.stringify(opts);
opts = {
	url: false,
	modules: true,
	minimize: isProd,
	sourceMap: !isProd,
	localIdentName: "[name]_[local]_[hash:base64:5]",
};
const cssModuleLoader = "css-loader?" + JSON.stringify(opts);
// https://github.com/webpack-contrib/css-loader#options
opts = {
	minimize: isProd,
	sourceMap: !isProd,
};
// npm i -D node-sass sass-loader 易出错可配镜像后卸载再试
// loader 在调用的时候才会去执行,因此不安装不调用是不会出错的
const scssStyleLoader = "sass-loader?" + JSON.stringify(opts);
// https://github.com/webpack-contrib/sass-loader
opts = {
	minimize: isProd,
	sourceMap: !isProd,
	relativeUrls: false,
	javascriptEnabled: true,
	modifyVars: {
		"@icon-url": JSON.stringify("../antd/antd"),
		"@primary-color": "#409eff",
		"@menu-dark-bg": "#404040",
		"@menu-highlight-color": "#39c6cd",
		"@menu-dark-item-active-bg": "#39c6cd",
		"@menu-dark-item-selected-bg": "#39c6cd",
	},
};
// https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less
const lessStyleLoader = "less-loader?" + JSON.stringify(opts);
// https://github.com/webpack-contrib/less-loader
const dps = Object.assign(
	{}, pkg.dependencies,
	pkg.devDependencies
);
const c = key => parseFloat(
	String(dps[key]).replace(/[^.\d]+/g, "")
);

const entry = {
	page: [""],
	rel, dir, dst, fmt, c,
	publicPath, prefixAjax,
	buildFolder, outputFolder,
	staticFolder, templateFolder,
	cssStyleLoader, cssModuleLoader,
	scssStyleLoader, lessStyleLoader,
	isProd, ver, min, ts, styleLoader,
	/* lib: {
		jquery: ["jquery", "jquery-ui"]
			.map(v => `./js/${v}.min`),
		ie8: ["es5-shim", "es5-sham", "html5shiv",
			"selectivizr", "nwmatcher", "respond"]
			.map(v => `./ie8/${v}.min`),
	}, */
	ipt: {
		public: [
			"babel-polyfill", // ie8 必须提前引入 es5-shim
			"media-match", // 支持 antd 所必须
			dir("src/utils/public.js"),
		].slice(isProd || IE_SHIM ? 0 : -1),
	},
	cdn: {
		jquery: "$",
		wangeditor: "wangEditor",
	},
	html: {
		title: "",
		ico: `favicon.ico`,
		js: [
			`js/jquery.min.js`,
			`js/jquery-ui.min.js`,
			`editor/wangeditor.min.js`,
			!`js/pace.min.js`,
			!`js/fastclick.min.js`,
			!`js/wangeditor.min.js`,
		],
		css: [
			`css/normalize-ie8.min.css`,
			`editor/wangeditor.min.css`,
			`antd/antd-1.11.6.css`,
			`fa/fa-4.x.min.css`,
			// highlight.js
			!`${bootcdn}highlight.js/9.12.0/styles/atom-one-light.min.css`,
			!`${bootcdn}highlight.js/9.12.0/styles/atom-one-dark.min.css`,
			!`${bootcdn}highlight.js/9.12.0/highlight.min.js`,
			// vant
			!`${elecdn}vant@1.3.0/lib/vant-css/index.css`,
			!`${delivr}npm/vant@1.3.0/lib/vant.min.js`,
			// antd
			!`antd/antd.min.css`,
		],
		// https://webpack.docschina.org/configuration/dev-server
		// https://github.com/chimurai/http-proxy-middleware#options
		proxy: {
			"/proxy": {
				target: "https://proxy.io",
				changeOrigin: true,
				secure: true,
				pathRewrite: { "^/proxy": "" },
				bypass: (req, res, proxyOptions) => {
					if (/\.html/.test(req.url)) {
						return req.originalUrl;
					}
				},
				onProxyReq: (proxyReq, req, res) => {
					proxyReq.setHeader("x-auth-token", "forever");
				},
				onProxyRes: (proxyRes, req, res) => {
					proxyRes.setHeader("location", "/login.html");
				},
			},
		},
	},
};

if (isProd) {
	if (PKG_CSS/* 纯打包编译样式文件 */) {
		entry.ipt = { style: "@/" + PKG_CSS };
		delete entry.page;
		delete entry.dll;
	}
} else if (DIR_SVC/* 使用静态文件服务器 */) {
	// 生产包做静态服务器
	entry.staticFolder = outputFolder;
	entry.ipt = { u: "@/utils/fns" };
	delete entry.page;
	delete entry.dll;
} else if (IE_SHIM/* 兼容 IE 浏览器 */) {
	entry.ie = true;
}
entry.html.chunks = Object.keys(entry.ipt || {});
module.exports = entry;