/*
* Простое модальное окно на основе data-атрибутов.
*
* @триггер открытия:
*
* <button data-modal-open=".some-modal">Открыть</button>
* data-modal-open — селектор открываемой модалки
*
* @разметка модалки:
*
* <div class="some-modal">                 — подложка (клик по ней закрывает модалку)
*     <div data-modal-content>             — контент модалки (клик по нему не закрывает)
*         ...содержимое...
*     </div>
* </div>
*
* @поведение:
* — при клике на data-modal-open к модалке и к нажатой кнопке добавляется класс active;
* — повторный клик по той же кнопке закрывает модалку;
* — клик вне data-modal-content закрывает модалку;
* — при открытии другой модалки предыдущая закрывается;
* — пока модалка открыта, на body добавляется класс scroll-lock
*   (overflow: hidden; padding-right: var(--sw)).
*
* @вызов:
*
* import { driveModal } from "../js/libs/driveModal";
* driveModal();
*
* @параметры вызова:
*
* open        - селектор кнопок-триггеров (по умолчанию '[data-modal-open]')
* contentAttr - имя data-атрибута контента (по умолчанию 'data-modal-content')
* active      - класс активного состояния (по умолчанию 'active')
* lock        - класс блокировки прокрутки body (по умолчанию 'scroll-lock')
* onOpen      - функция обратного вызова после открытия (modal, button)
* onClose     - функция обратного вызова после закрытия (modal, button)
*
*/

export const driveModal = (props = {}) => {
	class Modal {
		constructor(props) {
			this.props = {
				open: '[data-modal-open]',
				close: '[data-modal-close]',
				contentAttr: 'data-modal-content',
				active: 'active',
				lock: 'scroll-lock',
				...props
			};

			this.modal = null;
			this.button = null;
			this.content = null;

			this.#init();
		}

		open(button) {
			const modal = document.querySelector(button.dataset.modalOpen);
			if (!modal) return;

			this.close();

			this.button = button;
			this.modal = modal;
			this.content = modal.querySelector(`[${this.props.contentAttr}]`);

			modal.classList.add(this.props.active);
			button.classList.add(this.props.active);

			document.body.classList.add(this.props.lock);

			this.props.onOpen?.call(this, modal, button);
		}

		close() {
			if (!this.modal) return;

			this.modal.classList.remove(this.props.active);
			this.button?.classList.remove(this.props.active);
			document.body.classList.remove(this.props.lock);

			this.props.onClose?.call(this, this.modal, this.button);

			this.modal = null;
			this.button = null;
			this.content = null;
		}

		toggle(button) {
			button.classList.contains(this.props.active)
				? this.close()
				: this.open(button);
		}

		#init() {
			document.addEventListener('click', (e) => {
				const button = e.target.closest(this.props.open);

				if (button) {
					e.preventDefault();
					this.toggle(button);
					return;
				}

				// клик по кнопке закрытия модалки
				if (this.modal && e.target.closest(this.props.close)) {
					e.preventDefault();
					this.close();
					return;
				}

				// клик вне контента — закрываем модалку
				if (this.modal && !e.target.closest(`[${this.props.contentAttr}]`)) {
					this.close();
				}
			});

			document.addEventListener('keydown', (e) => {
				if (this.modal && (e.key === 'Escape' || e.key === 'Esc')) {
					this.close();
				}
			});
		}
	}

	return new Modal(props);
};