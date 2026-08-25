import { throttle } from "./libs/utils";
import { driveModal } from "./libs/driveModal";
import { driveTabs } from "./libs/driveTabs";
import "./polyfills.js";
import "./blocks.js";
import Swiper from "swiper";
import { Fancybox } from "@fancyapps/ui";
import { Pagination } from "swiper/modules";
import { Navigation } from "swiper/modules";

// Функции

// Ширина скроллбара
const setScrollbarWidth = () => {
	document.documentElement.style.setProperty('--sw', `${window.innerWidth - document.documentElement.clientWidth}px`);
}

// Тема сайта
const THEME_KEY = 'theme';

const getTheme = () => {
	const theme = document.documentElement.getAttribute('data-theme');
	return theme === 'light' ? 'light' : 'dark';
};

const setTheme = (theme) => {
	const next = theme === 'light' ? 'light' : 'dark';
	document.documentElement.setAttribute('data-theme', next);

	try {
		localStorage.setItem(THEME_KEY, next);
	} catch (e) { }

	return next;
};

const initHeader = () => {
	const control = document.querySelector('.header__control');
	if (!control) return;

	const buttons = {
		dark: control.querySelector('[data-theme-toggle="dark"]'),
		light: control.querySelector('[data-theme-toggle="light"]'),
	};

	const applyTheme = (theme) => {
		setTheme(theme);

		Object.entries(buttons).forEach(([key, btn]) => {
			if (btn) btn.setAttribute('aria-pressed', String(key === theme));
		});
	};

	applyTheme(getTheme());

	Object.entries(buttons).forEach(([key, btn]) => {
		if (btn) btn.addEventListener('click', () => applyTheme(key));
	});
};

const initSwipers = () => {
	new Swiper(".popular__swiper", {
		slidesPerView: 1.05,
		spaceBetween: 10,

		breakpoints: {
			640: {
				slidesPerView: 2.05
			},
			960: {
				spaceBetween: 20,
				slidesPerView: 3
			}
		}
	});

	new Swiper(".product__swiper", {
		loop: true,
		modules: [Pagination, Navigation],

		navigation: {
			prevEl: ".product__gallery-navigation-btn_prev",
			nextEl: ".product__gallery-navigation-btn_next"
		},

		pagination: {
			el: ".product__gallery-pagination",
			clickable: true,
			bulletClass: "swiper-bullet",
			bulletActiveClass: "swiper-bullet-active"
		}
	});
}

const initFancybox = () => {
	if (!document.querySelector("[data-fancybox]")) return;

	Fancybox.bind("[data-fancybox]", {
		groupAttr: "data-fancybox"
	});
}

const initProductTabs = () => {
	if (!document.querySelector(".product-tabs")) return;

	driveTabs({
		container: ".product-tabs",
		controls: ".product-tabs__navigation-btn",
		selects: [".product-tabs__tab"],
		cls: "active"
	});
}

// Запуск функций
window.addEventListener("load", () => {
	setScrollbarWidth();
	initHeader();
	driveModal();
	initSwipers();
	initFancybox();
	initProductTabs();
});
