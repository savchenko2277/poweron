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

const initLocations = () => {
	const select = document.querySelector(".locations__select");
	if (!select) return;

	const head = select.querySelector(".locations__select-head");
	const headText = head?.querySelector("p");
	const items = select.querySelectorAll(".locations__select-item");
	const tabs = document.querySelectorAll(".locations__tab");
	const aboutItems = document.querySelectorAll(".locations__about-item");
	const cardItems = document.querySelectorAll(".locations .location-card");
	const moreBtn = document.querySelector(".locations__more");
	const moreCount = moreBtn?.querySelector(".locations__more-count");

	const VISIBLE_CARDS = 2;
	const mq = window.matchMedia("(max-width: 1100px)");

	const close = () => select.classList.remove("is-open");

	// Показываем about-карточку по id (id карточки === id about-карточки)
	const setActiveAbout = (id) => {
		aboutItems.forEach((item) => {
			item.classList.toggle("active", item.dataset.locationId === id);
		});
	};

	// Показываем about-карточку по имени города (для выпадающего списка регионов)
	const setActiveAboutByName = (name) => {
		const target = name && name !== "Все" ? name : aboutItems[0]?.dataset.locationName;
		aboutItems.forEach((item) => {
			item.classList.toggle("active", item.dataset.locationName === target);
		});
	};

	// Подсвечиваем только одну (переданную) карточку
	const setActiveCard = (card) => {
		cardItems.forEach((c) => c.classList.toggle("active", c === card));
	};

	// Сворачиваем карточки вкладки: видимы первые VISIBLE_CARDS
	const collapseTab = (tab) => {
		tab.querySelectorAll(".location-card").forEach((card, i) => {
			card.classList.toggle("is-hidden", mq.matches && i >= VISIBLE_CARDS);
		});
	};

	// Обновляем кнопку "Показать еще" по активной вкладке
	const updateMore = () => {
		if (!moreBtn) return;

		const activeTab = document.querySelector(".locations__tab.active");
		const hiddenCount = activeTab?.querySelectorAll(".location-card.is-hidden").length || 0;
		const show = mq.matches && hiddenCount > 0;

		moreBtn.classList.toggle("is-hidden", !show);
		if (moreCount) moreCount.textContent = hiddenCount;
	};

	const activate = (name = "Все") => {
		tabs.forEach((tab) => {
			tab.classList.toggle("active", tab.dataset.locationName === name);
		});

		const activeTab = [...tabs].find((tab) => tab.dataset.locationName === name);
		if (activeTab) {
			collapseTab(activeTab);

			const firstVisible = activeTab.querySelector(".location-card");
			if (firstVisible) setActiveCard(firstVisible);
		}

		setActiveAboutByName(name);

		if (headText) headText.textContent = name;

		items.forEach((item) => {
			item.classList.toggle("is-active", item.textContent.trim() === name);
		});

		updateMore();
	};

	// Открытие/закрытие выпадающего списка по клику на шапку селекта
	head?.addEventListener("click", () => {
		select.classList.toggle("is-open");
	});

	// Переключение вкладки города по клику на пункт селекта
	items.forEach((item) => {
		item.addEventListener("click", () => {
			const name = item.textContent.trim();
			activate(name);
			close();
		});
	});

	// Клик по карточке локации — активируем её и показываем about с тем же id
	cardItems.forEach((card) => {
		card.addEventListener("click", () => {
			const id = card.dataset.locationId;
			if (!id) return;

			setActiveCard(card);
			setActiveAbout(id);
		});
	});

	// Кнопка "Показать еще" — раскрываем скрытые карточки активной вкладки
	moreBtn?.addEventListener("click", () => {
		const activeTab = document.querySelector(".locations__tab.active");
		activeTab?.querySelectorAll(".location-card.is-hidden").forEach((card) => {
			card.classList.remove("is-hidden");
		});
		updateMore();
	});

	// Закрытие селекта по клику вне него
	document.addEventListener("click", (e) => {
		if (!select.contains(e.target)) close();
	});

	// Инициализация: сворачиваем все вкладки, активируем первую карточку и её about
	tabs.forEach(collapseTab);

	const firstCard = cardItems[0];
	const firstAboutId = aboutItems[0]?.dataset.locationId;
	if (firstCard) setActiveCard(firstCard);
	if (firstAboutId) setActiveAbout(firstAboutId);
	updateMore();

	// При изменении ширины экрана пересчитываем состояние карточек и кнопки
	mq.addEventListener("change", () => {
		tabs.forEach(collapseTab);
		updateMore();
	});
}

const initFaq = () => {
	const items = document.querySelectorAll(".faq__item");
	if (!items.length) return;

	items.forEach((item) => {
		const head = item.querySelector(".faq__item-head");
		if (!head) return;

		head.addEventListener("click", () => {
			const isActive = item.classList.contains("active");

			// Закрываем остальные пункты (аккордеон)
			items.forEach((other) => other.classList.remove("active"));

			// Открываем текущий пункт, если он был закрыт
			if (!isActive) item.classList.add("active");
		});
	});
};

// Запуск функций
window.addEventListener("load", () => {
	setScrollbarWidth();
	initHeader();
	driveModal();
	initSwipers();
	initFancybox();
	initProductTabs();
	initLocations();
	initFaq();
});
