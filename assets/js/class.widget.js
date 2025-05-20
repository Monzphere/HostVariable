/*
** Copyright (C) 2001-2025 Zabbix SIA
**
** This program is free software: you can redistribute it and/or modify it under the terms of
** the GNU Affero General Public License as published by the Free Software Foundation, version 3.
**
** This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
** without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
** See the GNU Affero General Public License for more details.
**
** You should have received a copy of the GNU Affero General Public License along with this program.
** If not, see <https://www.gnu.org/licenses/>.
**/


class CustomWidgetHostNavigator extends CWidget {

	/**
	 * Host dropdown instance.
	 *
	 * @type {CHostSelectDropdown|null}
	 */
	#host_filter_element = null;

	/**
	 * Listeners of host navigator widget.
	 *
	 * @type {Object}
	 */
	#listeners = {};

	/**
	 * Scroll amount of contents.
	 *
	 * @type {number}
	 */
	#contents_scroll_top = 0;

	/**
	 * ID of selected host.
	 *
	 * @type {string|null}
	 */
	#selected_hostid = null;

	/**
	 * CSRF token for navigation.tree.toggle action.
	 *
	 * @type {string|null}
	 */
	#csrf_token = null;

	/**
	 * Interval ID para tentativas de inserção 
	 *
	 * @type {number|null}
	 */
	#insertion_interval = null;

	/**
	 * Contador de tentativas de inserção
	 * 
	 * @type {number}
	 */
	#insertion_attempts = 0;
	
	/**
	 * Referência ao botão de edição
	 * 
	 * @type {HTMLElement|null}
	 */
	#edit_button = null;
	
	/**
	 * Elemento de container do filtro
	 * 
	 * @type {HTMLElement|null}
	 */
	#filter_container = null;

	constructor(widget_reference) {
		super(widget_reference);
		
		// Ocultar imediatamente o widget
		this.#hideOriginalWidget();
	}
	
	// Método para ocultar o widget original
	#hideOriginalWidget() {
		// Encontrar o elemento widget atual
		let widgetElement = null;
		
		try {
			// Se temos acesso direto ao container do widget
			if (this._container) {
				widgetElement = this._container.closest('.dashboard-grid-widget');
			}
			
			// Se não encontrou pelo container, tenta por ID
			if (!widgetElement && this._widgetid) {
				widgetElement = document.querySelector(`[data-widgetid="${this._widgetid}"]`);
			}
			
			// Tenta por outros métodos se ainda não encontrou
			if (!widgetElement) {
				// Tenta encontrar pelo título
				const widgetsByTitle = document.querySelectorAll('.dashboard-grid-widget-head');
				for (const head of widgetsByTitle) {
					if (head.textContent.includes('Host navigator')) {
						widgetElement = head.closest('.dashboard-grid-widget');
						break;
					}
				}
			}
			
			// Se encontrou o widget, adiciona classe para ocultá-lo
			if (widgetElement) {
				widgetElement.classList.add('js-host-navigator-widget');
				widgetElement.style.display = 'none';
				widgetElement.style.height = '0';
				widgetElement.style.width = '0';
				widgetElement.style.overflow = 'hidden';
				widgetElement.style.position = 'absolute';
				widgetElement.style.visibility = 'hidden';
				
				// Armazenar a referência para uso posterior
				this._widgetElement = widgetElement;
			}
		} catch (e) {
			console.error('Erro ao tentar ocultar o widget:', e);
		}
	}
	
	// Método para criar o botão de edição
	#createEditButton() {
		const editButton = document.createElement('button');
		editButton.className = 'host-nav-edit-button';
		editButton.setAttribute('type', 'button');
		editButton.setAttribute('data-tooltip', 'Editar Host Navigator');
		
		// Adicionar evento de clique para entrar no modo de edição
		editButton.addEventListener('click', (event) => {
			event.preventDefault();
			this.#enterEditMode();
		});
		
		return editButton;
	}
	
	// Método para entrar no modo de edição do widget
	#enterEditMode() {
		try {
			
			// Várias estratégias para entrar no modo de edição
			
			// 1. Verificar se estamos no modo de edição do dashboard
			const isEditMode = document.querySelector('.dashboard-grid-widget-edit-mode');
			if (!isEditMode) {
				// Tentar clicar no botão de edição do dashboard
				const editDashboardBtn = document.querySelector('.btn-dashbrd-edit, .btn-edit, [data-action="dashboard.edit"]');
				if (editDashboardBtn) {
					editDashboardBtn.click();
					
					// Aguardar a ativação do modo de edição
					setTimeout(() => {
						this.#showWidget();
					}, 500);
				} else {
					// Se não encontrou o botão, tentar abrir diretamente
					this.#showWidget();
				}
			} else {
				// Já estamos no modo de edição, apenas mostrar o widget
				this.#showWidget();
			}
		} catch (e) {
			console.error('Erro ao tentar entrar no modo de edição:', e);
		}
	}
	
	// Método para mostrar o widget original
	#showWidget() {
		if (this._widgetElement) {
			// Remover estilos inline
			this._widgetElement.style.display = '';
			this._widgetElement.style.height = '';
			this._widgetElement.style.width = '';
			this._widgetElement.style.overflow = '';
			this._widgetElement.style.position = '';
			this._widgetElement.style.visibility = '';
			
			// Adicionar classe que indica que deve ser mostrado
			this._widgetElement.classList.add('force-show-widget');
			
			// Tentar abrir o menu de configuração do widget
			const editButton = this._widgetElement.querySelector('.btn-widget-edit, .btn-edit-widget, [data-action="widget.edit"]');
			if (editButton) {
				editButton.click();
			} else {
				// Alternativa: tentar clicar no menu de ações
				const actionMenu = this._widgetElement.querySelector('.btn-widget-action, .btn-more, .menu-popup-button');
				if (actionMenu) {
					actionMenu.click();
					
					// Tentar clicar na opção de edição no menu popup
					setTimeout(() => {
						const editOption = document.querySelector('.menu-popup-item[data-action="widget.edit"], .menu-popup-item-edit');
						if (editOption) {
							editOption.click();
						}
					}, 300);
				} else {
					console.log('Não foi possível encontrar botões de edição. Widget está visível no modo de edição.');
				}
			}
			
			// Rolar a página até o widget
			setTimeout(() => {
				this._widgetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}, 500);
		} else {
			console.error('Não foi possível encontrar o widget original');
		}
	}
	
	// Remover filtro existente para evitar duplicações
	#removeExistingFilter() {
		const existingFilter = document.querySelector('.host-filter-container');
		if (existingFilter) {
			existingFilter.remove();
		}
	}

	onActivate() {
		this._contents.scrollTop = this.#contents_scroll_top;
		
		// Oculta novamente o widget quando ativado
		this.#hideOriginalWidget();
		
		// Tenta novamente inserir o dropdown quando o widget é ativado, caso não tenha sido bem-sucedido antes
		if (this.#host_filter_element !== null && !document.querySelector('.host-filter-container')) {
			this.#insertDropdownWithRetries();
		}
	}

	onDeactivate() {
		this.#contents_scroll_top = this._contents.scrollTop;
	}

	onDestroy() {
		// Limpar qualquer interval pendente
		if (this.#insertion_interval !== null) {
			clearInterval(this.#insertion_interval);
			this.#insertion_interval = null;
		}
		
		// Remover botão de edição
		if (this.#edit_button) {
			this.#edit_button.remove();
			this.#edit_button = null;
		}
		
		// Remover container do filtro
		if (this.#filter_container) {
			this.#filter_container.remove();
			this.#filter_container = null;
		}
	}

	getUpdateRequestData() {
		return {
			...super.getUpdateRequestData(),
			with_config: this.#host_filter_element === null ? 1 : undefined
		};
	}

	setContents(response) {
		if (response.hosts.length === 0) {
			this.clearContents();
			this.setCoverMessage({
				message: t('No data found'),
				icon: ZBX_ICON_SEARCH_LARGE
			});

			return;
		}

		this.#csrf_token = response[CSRF_TOKEN_NAME];

		if (this.#host_filter_element === null) {
			this.clearContents();

			// Criar o dropdown com a configuração
			const dropdownConfig = response.config || {};
			this.#host_filter_element = new CHostSelectDropdown(dropdownConfig);
			
			// Inserir o dropdown quando o DOM estiver pronto
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', () => {
					this.#insertDropdownWithRetries();
				});
			} else {
				// O DOM já está carregado
				this.#insertDropdownWithRetries();
			}

			this.#registerListeners();
			this.#activateListeners();
			
			// Oculta novamente o widget após configuração
			this.#hideOriginalWidget();
		}

		this.#host_filter_element.setValue({
			hosts: response.hosts,
			selected_hostid: this.#selected_hostid
		});

		if (!this.hasEverUpdated() && this.isReferred()) {
			this.#selected_hostid = this.#getDefaultSelectable();

			if (this.#selected_hostid !== null) {
				this.#host_filter_element.selectItem(this.#selected_hostid);
			}
		}
	}

	// Método para tentar inserir o dropdown com intervalos e tentativas
	#insertDropdownWithRetries() {
		// Remover qualquer filtro existente para evitar duplicação
		this.#removeExistingFilter();
		
		// Primeira tentativa imediata
		const success = this.#insertDropdownBelowBreadcrumbs();
		
		// Se não conseguiu inserir, configurar tentativas com intervalo
		if (!success) {
			this.#insertion_attempts = 1; // Já fizemos uma tentativa
			
			// Limpar qualquer intervalo existente
			if (this.#insertion_interval !== null) {
				clearInterval(this.#insertion_interval);
			}
			
			// Configurar tentativas a cada 500ms, até 10 tentativas
			this.#insertion_interval = setInterval(() => {
				this.#insertion_attempts++;
				
				// Tenta inserir novamente
				const success = this.#insertDropdownBelowBreadcrumbs();
				
				// Se conseguiu inserir ou atingiu o limite de tentativas, parar
				if (success || this.#insertion_attempts >= 10) {
					clearInterval(this.#insertion_interval);
					this.#insertion_interval = null;
					
					// Se todas as tentativas falharam, usar o fallback
					if (!success && this.#insertion_attempts >= 10) {
						this.#insertInTopElement();
						console.log('Todas as tentativas de inserção falharam. Usando fallback no topo do documento.');
					}
				}
			}, 500);
		}
		
		return success;
	}

	// Método específico para inserir o dropdown abaixo da barra de breadcrumbs
	#insertDropdownBelowBreadcrumbs() {
		// Verificar se já existe um dropdown inserido
		if (document.querySelector('.host-filter-container')) {
			return true; // Já inserido, não precisa fazer nada
		}
		
		// Função auxiliar para encontrar elementos com texto específico (versão nativa sem jQuery)
		const findElementContainingText = (selector, text) => {
			const elements = document.querySelectorAll(selector);
			for (let i = 0; i < elements.length; i++) {
				if (elements[i].textContent && elements[i].textContent.indexOf(text) !== -1) {
					return elements[i];
				}
			}
			return null;
		};
		
		// Procurar pelo elemento de breadcrumbs ou qualquer elemento que contenha o texto do breadcrumb
		let breadcrumbElement = null;
		
		// 1. Tenta pelo seletor de classe comum
		breadcrumbElement = document.querySelector('.breadcrumbs');
		
		// 2. Tenta encontrar links que podem pertencer ao breadcrumb
		if (!breadcrumbElement) {
			const allDashboardsLink = findElementContainingText('a', 'All dashboards');
			if (allDashboardsLink) {
				breadcrumbElement = allDashboardsLink.closest('div');
			}
		}
		
		// 3. Tenta encontrar links com href específico
		if (!breadcrumbElement) {
			const dashboardsLinks = document.querySelectorAll('a[href*="dashboard.list"], a[href*="dashboards"]');
			if (dashboardsLinks.length > 0) {
				breadcrumbElement = dashboardsLinks[0].closest('div');
			}
		}
		
		// 4. Busca pelo texto "teste navegador" ou "All dashboards" em qualquer elemento
		if (!breadcrumbElement) {
			const elementsWithDashboardText = document.querySelectorAll('*');
			for (let i = 0; i < elementsWithDashboardText.length; i++) {
				const elementText = elementsWithDashboardText[i].textContent || '';
				if (
					(elementText.includes('All dashboards') && elementText.includes('teste navegador')) ||
					elementText.includes('All dashboards /') ||
					/All dashboards\s*\//.test(elementText)
				) {
					// Encontra o elemento pai mais adequado
					let candidate = elementsWithDashboardText[i];
					// Se for um nó de texto, pegue o pai
					if (candidate.nodeType === 3) {
						candidate = candidate.parentElement;
					}
					// Se for um elemento inline, pegue o container
					if (getComputedStyle(candidate).display === 'inline') {
						candidate = candidate.parentElement;
					}
					breadcrumbElement = candidate;
					break;
				}
			}
		}
		
		// Se encontrou um elemento adequado
		if (breadcrumbElement) {
			
			// Criar o container para o filtro
			this.#filter_container = document.createElement('div');
			this.#filter_container.classList.add('host-filter-container', 'breadcrumb-filter');
			
			// Adicionar o dropdown ao container
			this.#filter_container.appendChild(this.#host_filter_element.getContainer());
			
			// Criar e adicionar o botão de edição
			this.#edit_button = this.#createEditButton();
			this.#filter_container.appendChild(this.#edit_button);
			
			// Inserir APÓS o breadcrumb
			const parentElement = breadcrumbElement.parentElement;
			
			if (parentElement) {
				// Criar um wrapper para manter a estrutura
				const wrapper = document.createElement('div');
				wrapper.classList.add('host-filter-wrapper');
				wrapper.style.display = 'flex';
				wrapper.style.padding = '8px 10px';
				wrapper.style.marginTop = '5px';
				wrapper.style.backgroundColor = '#f5f5f5';
				wrapper.style.borderRadius = '3px';
				wrapper.style.alignItems = 'center';
				
				// Adicionar o ícone "Host:" à esquerda (similar ao que aparece na imagem compartilhada)
				const hostLabel = document.createElement('div');
				hostLabel.textContent = 'Host:';
				hostLabel.style.marginRight = '10px';
				hostLabel.style.fontWeight = 'bold';
				
				wrapper.appendChild(hostLabel);
				wrapper.appendChild(this.#filter_container);
				
				// Inserir após o breadcrumb
				if (breadcrumbElement.nextSibling) {
					parentElement.insertBefore(wrapper, breadcrumbElement.nextSibling);
				} else {
					parentElement.appendChild(wrapper);
				}
				
				// Aplicar CSS para garantir que fique semelhante ao formato que o usuário mostrou na imagem
				const style = document.createElement('style');
				style.textContent = `
					.host-filter-wrapper {
						width: 100%;
						margin-bottom: 10px;
						box-sizing: border-box;
					}
					.breadcrumb-filter {
						padding: 0;
						margin: 0;
						display: flex;
						flex-grow: 1;
					}
					.host-select-dropdown-container .host-select-label {
						display: none;
					}
					.host-select-dropdown {
						width: 100%;
						min-width: 250px;
						margin-right: 10px;
						color: black; /* Garantir que o texto do dropdown seja preto */
					}
					.host-select-dropdown option {
						color: black; /* Garantir que as opções do dropdown sejam pretas */
					}
				`;
				document.head.appendChild(style);
				
				// Adicionar CSS para ocultar o widget original
				this.#addHideWidgetStyles();
				
				return true;
			}
		}
		
		return false;
	}
	
	// Método simplificado para adicionar estilos que ocultam o widget
	#addHideWidgetStyles() {
		const style = document.createElement('style');
		style.textContent = `
			.dashboard-grid-widget[data-type="hostvariable"],
			.widget-hostvariable,
			.js-host-navigator-widget,
			div[class*="host-navigator"],
			[data-widgetid="${this._widgetid}"] {
				display: none !important;
				visibility: hidden !important;
				height: 0 !important;
				min-height: 0 !important;
				width: 0 !important;
				min-width: 0 !important;
				margin: 0 !important;
				padding: 0 !important;
				border: none !important;
				overflow: hidden !important;
				opacity: 0 !important;
				position: absolute !important;
				left: -9999px !important;
				top: -9999px !important;
			}
			
			/* Exceção para o modo de edição */
			.dashboard-grid-widget-edit-mode .js-host-navigator-widget,
			.dashboard-grid-widget-edit-mode [data-widgetid="${this._widgetid}"],
			.js-host-navigator-widget.force-show-widget {
				display: block !important;
				visibility: visible !important;
				height: auto !important;
				width: auto !important;
				position: static !important;
				left: auto !important;
				top: auto !important;
			}
		`;
		document.head.appendChild(style);
	}
	
	// Método para inserir diretamente no topo do body como último recurso
	#insertInTopElement() {
		this.#removeExistingFilter();
		
		// Criar container personalizado para o dropdown
		this.#filter_container = document.createElement('div');
		this.#filter_container.classList.add('host-filter-container');
		this.#filter_container.style.position = 'fixed';
		this.#filter_container.style.top = '10px';
		this.#filter_container.style.left = '80px';
		this.#filter_container.style.zIndex = '1000';
		this.#filter_container.style.background = 'white';
		this.#filter_container.style.padding = '8px';
		this.#filter_container.style.borderRadius = '4px';
		this.#filter_container.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
		this.#filter_container.style.display = 'flex';
		this.#filter_container.style.alignItems = 'center';
		
		// Adicionar label
		const hostLabel = document.createElement('div');
		hostLabel.textContent = 'Host:';
		hostLabel.style.marginRight = '10px';
		hostLabel.style.fontWeight = 'bold';
		this.#filter_container.appendChild(hostLabel);
		
		// Adicionar o dropdown ao container
		this.#filter_container.appendChild(this.#host_filter_element.getContainer());
		
		// Esconder o label do dropdown original já que adicionamos um próprio
		const originalLabel = this.#host_filter_element.getContainer().querySelector('.host-select-label');
		if (originalLabel) {
			originalLabel.style.display = 'none';
		}
		
		// Criar e adicionar o botão de edição
		this.#edit_button = this.#createEditButton();
		this.#filter_container.appendChild(this.#edit_button);
		
		// Adicionar ao body
		document.body.insertBefore(this.#filter_container, document.body.firstChild);
		
		// Adicionar CSS para garantir que o texto do dropdown seja preto
		const style = document.createElement('style');
		style.textContent = `
			.host-select-dropdown {
				color: black !important;
			}
			.host-select-dropdown option {
				color: black !important;
			}
		`;
		document.head.appendChild(style);
		
		// Ocultar o widget original de forma agressiva
		this.#hideOriginalWidget();
		this.#addHideWidgetStyles();
	}

	#broadcast() {
		this.broadcast({
			[CWidgetsData.DATA_TYPE_HOST_ID]: [this.#selected_hostid],
			[CWidgetsData.DATA_TYPE_HOST_IDS]: [this.#selected_hostid]
		});
	}

	#getDefaultSelectable() {
		// Para o dropdown, pegamos o valor selecionado (se houver)
		return this.#host_filter_element ? this.#host_filter_element.getValue() : null;
	}

	onReferredUpdate() {
		if (this.#host_filter_element === null || this.#selected_hostid !== null) {
			return;
		}

		this.#selected_hostid = this.#getDefaultSelectable();

		if (this.#selected_hostid !== null) {
			this.#host_filter_element.selectItem(this.#selected_hostid);
		}
	}

	#registerListeners() {
		this.#listeners = {
			hostSelect: ({detail}) => {
				this.#selected_hostid = detail.hostid;
				this.#broadcast();
			}
		};
	}

	#activateListeners() {
		this.#host_filter_element.getContainer().addEventListener(CHostSelectDropdown.EVENT_HOST_SELECT,
			this.#listeners.hostSelect
		);
	}

	hasPadding() {
		// Como o dropdown está posicionado fora do widget, podemos esconder o widget
		return false;
	}

	onClearContents() {
		// Limpar qualquer interval pendente
		if (this.#insertion_interval !== null) {
			clearInterval(this.#insertion_interval);
			this.#insertion_interval = null;
		}
		
		// Remover botão de edição
		if (this.#edit_button) {
			this.#edit_button.remove();
			this.#edit_button = null;
		}
		
		// Remover container do filtro
		if (this.#filter_container) {
			this.#filter_container.remove();
			this.#filter_container = null;
		}
		
		if (this.#host_filter_element !== null) {
			this.#host_filter_element.destroy();
			this.#host_filter_element = null;
		}
	}
}
