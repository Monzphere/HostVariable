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


class CHostSelectDropdown {
    static EVENT_HOST_SELECT = 'host.select';

    #container;
    #inputElement;
    #optionsList;
    #config;
    #hosts = [];
    #selected_hostid = null;
    #filteredHosts = [];
    #isOptionsVisible = false;
    #selectedIndex = -1;
    #documentClickHandler = null;

    constructor(config) {
        this.#config = config;

        this.#container = document.createElement('div');
        this.#container.classList.add('host-select-dropdown-container');
        this.#container.setAttribute('data-role', 'host-selector');

        const label = document.createElement('label');
        label.textContent = 'Host: ';
        label.classList.add('host-select-label');
        this.#container.appendChild(label);

        // Create input text instead of select
        this.#inputElement = document.createElement('input');
        this.#inputElement.type = 'text';
        this.#inputElement.classList.add('host-select-dropdown');
        this.#inputElement.placeholder = '-- Type to search hosts --';
        this.#container.appendChild(this.#inputElement);

        // Create options list with absolute positioning
        this.#optionsList = document.createElement('div');
        this.#optionsList.classList.add('host-options-list');
        document.body.appendChild(this.#optionsList);

        // Setup event listeners
        this.#setupEventListeners();
    }

    #setupEventListeners() {
        // Input: filter hosts when typing
        this.#inputElement.addEventListener('input', () => {
            const query = this.#inputElement.value.toLowerCase().trim();
            this.#filterHosts(query);
            
            // Always show options when typing
            this.#showOptions();
        });

        // Focus: show all options on focus
        this.#inputElement.addEventListener('focus', () => {
            // Reset filtered hosts to show all options
            this.#filteredHosts = [...this.#hosts];
            this.#renderOptions();
            this.#showOptions();
        });

        // Click: show options on click (some browsers may not trigger focus)
        this.#inputElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.#filteredHosts = [...this.#hosts];
            this.#renderOptions();
            this.#showOptions();
        });

        // Blur: hide options when losing focus, except when clicking on the options list
        this.#inputElement.addEventListener('blur', (e) => {
            // Small delay to allow option selection by click
            setTimeout(() => {
                // Check if the active element is inside the options list
                const activeElement = document.activeElement;
                if (this.#optionsList.contains(activeElement)) {
                    return;
                }
                
                this.#hideOptions();
                
                // If no valid host is selected, clear the input
                const currentValue = this.#inputElement.value.trim();
                if (currentValue) {
                    const selectedHost = this.#hosts.find(host => 
                        host.name.toLowerCase() === currentValue.toLowerCase()
                    );
                    
                    if (!selectedHost) {
                        // Try to find a host that starts with the text
                        const partialMatch = this.#hosts.find(host => 
                            host.name.toLowerCase().startsWith(currentValue.toLowerCase())
                        );
                        
                        if (partialMatch) {
                            this.#selectHost(partialMatch.hostid, partialMatch.name);
                        } else {
                            // If not found, clear the input
                            this.#inputElement.value = '';
                            this.#selected_hostid = null;
                            
                            // Dispatch select event with null hostid
                            this.#dispatchSelectEvent(null);
                        }
                    }
                } else {
                    this.#selected_hostid = null;
                    this.#dispatchSelectEvent(null);
                }
            }, 200);
        });

        // Keyboard navigation and selection
        this.#inputElement.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.#navigateOptions(1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.#navigateOptions(-1);
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.#selectCurrentOption();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.#hideOptions();
                    break;
            }
        });

        // Close options when clicking outside the input and options list
        this.#documentClickHandler = (e) => {
            // Se o clique foi dentro do input ou da lista de opções, não faz nada
            if (this.#inputElement === e.target || this.#optionsList.contains(e.target)) {
                return;
            }
            
            // Se o clique foi em outro lugar, esconde as opções
            if (this.#isOptionsVisible) {
                this.#hideOptions();
            }
        };
        
        document.addEventListener('click', this.#documentClickHandler);
        
        // Ajustar posição ao rolar a página
        window.addEventListener('scroll', () => {
            if (this.#isOptionsVisible) {
                this.#updateOptionsPosition();
            }
        }, true);
        
        // Ajustar posição ao redimensionar a janela
        window.addEventListener('resize', () => {
            if (this.#isOptionsVisible) {
                this.#updateOptionsPosition();
            }
        });
    }

    #filterHosts(query) {
        if (!query) {
            this.#filteredHosts = [...this.#hosts];
        } else {
            // Filter hosts containing typed text (case insensitive)
            this.#filteredHosts = this.#hosts.filter(host => 
                host.name.toLowerCase().includes(query)
            );
        }
        
        this.#renderOptions();
    }

    #renderOptions() {
        this.#optionsList.innerHTML = '';
        this.#selectedIndex = -1;
        
        if (this.#filteredHosts.length === 0) {
            const noResults = document.createElement('div');
            noResults.classList.add('host-option-item');
            noResults.textContent = 'No hosts found';
            noResults.style.fontStyle = 'italic';
            noResults.style.color = 'gray';
            this.#optionsList.appendChild(noResults);
            return;
        }
        
        // Add "clear selection" item
        if (this.#selected_hostid) {
            const clearOption = document.createElement('div');
            clearOption.classList.add('host-option-item');
            clearOption.textContent = '-- Clear selection --';
            clearOption.dataset.hostid = '';
            clearOption.style.borderBottom = '1px solid #ccc';
            clearOption.style.fontStyle = 'italic';
            
            clearOption.addEventListener('click', () => {
                this.#inputElement.value = '';
                this.#selected_hostid = null;
                this.#dispatchSelectEvent(null);
                this.#hideOptions();
            });
            
            this.#optionsList.appendChild(clearOption);
        }
        
        // Sort hosts alphabetically
        const sortedHosts = [...this.#filteredHosts].sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
        
        // Create element for each host
        sortedHosts.forEach(host => {
            const option = document.createElement('div');
            option.classList.add('host-option-item');
            option.textContent = host.name;
            option.dataset.hostid = host.hostid;
            
            option.addEventListener('click', () => {
                this.#selectHost(host.hostid, host.name);
                this.#hideOptions();
            });
            
            this.#optionsList.appendChild(option);
        });
    }

    #navigateOptions(direction) {
        const options = this.#optionsList.querySelectorAll('.host-option-item');
        if (options.length === 0) return;
        
        // Remove previous selection
        if (this.#selectedIndex >= 0 && this.#selectedIndex < options.length) {
            options[this.#selectedIndex].classList.remove('selected');
        }
        
        // Update index
        this.#selectedIndex += direction;
        if (this.#selectedIndex < 0) this.#selectedIndex = options.length - 1;
        if (this.#selectedIndex >= options.length) this.#selectedIndex = 0;
        
        // Add selection to current item
        const selectedOption = options[this.#selectedIndex];
        selectedOption.classList.add('selected');
        
        // Ensure selected item is visible
        selectedOption.scrollIntoView({ block: 'nearest' });
    }

    #selectCurrentOption() {
        const options = this.#optionsList.querySelectorAll('.host-option-item');
        if (options.length === 0 || this.#selectedIndex < 0 || this.#selectedIndex >= options.length) {
            return;
        }
        
        const selected = options[this.#selectedIndex];
        const hostid = selected.dataset.hostid;
        
        if (hostid === '') {
            // "Clear selection" option
            this.#inputElement.value = '';
            this.#selected_hostid = null;
            this.#dispatchSelectEvent(null);
        } else {
            this.#selectHost(hostid, selected.textContent);
        }
        
        this.#hideOptions();
    }

    #selectHost(hostid, name) {
        this.#selected_hostid = hostid;
        this.#inputElement.value = name || '';
        this.#dispatchSelectEvent(hostid);
    }

    #dispatchSelectEvent(hostid) {
        this.#container.dispatchEvent(new CustomEvent(CHostSelectDropdown.EVENT_HOST_SELECT, {
            detail: {
                hostid: hostid
            }
        }));
    }

    #showOptions() {
        // Renderizar as opções
        this.#renderOptions();
        
        // Atualizar a posição da lista
        this.#updateOptionsPosition();
        
        // Exibir a lista
        this.#optionsList.style.display = 'block';
        this.#isOptionsVisible = true;
    }

    #hideOptions() {
        this.#optionsList.style.display = 'none';
        this.#isOptionsVisible = false;
    }

    setValue({ hosts, selected_hostid }) {
        // Store data
        this.#hosts = hosts || [];
        this.#selected_hostid = selected_hostid || this.#selected_hostid;
        
        // Find selected host to display its name in input
        if (this.#selected_hostid) {
            const selectedHost = this.#hosts.find(host => host.hostid === this.#selected_hostid);
            if (selectedHost) {
                this.#inputElement.value = selectedHost.name;
            }
        }
    }

    getContainer() {
        return this.#container;
    }

    getValue() {
        return this.#selected_hostid;
    }

    getHosts() {
        return this.#hosts;
    }

    destroy() {
        // Remove all event listeners
        if (this.#inputElement) {
            this.#inputElement.replaceWith(this.#inputElement.cloneNode(true));
        }
        
        // Remove document click handler
        if (this.#documentClickHandler) {
            document.removeEventListener('click', this.#documentClickHandler);
        }
        
        // Remove window event listeners
        window.removeEventListener('scroll', this.#updateOptionsPosition);
        window.removeEventListener('resize', this.#updateOptionsPosition);
        
        // Clear options list
        if (this.#optionsList) {
            this.#optionsList.innerHTML = '';
            // Remover a lista do body
            document.body.removeChild(this.#optionsList);
        }
        
        // Remove DOM elements
        if (this.#container) {
            this.#container.remove();
        }
        
        this.#inputElement = null;
        this.#optionsList = null;
        this.#container = null;
        this.#hosts = [];
        this.#filteredHosts = [];
        this.#selected_hostid = null;
    }

    selectItem(host_id) {
        if (!host_id) {
            this.#inputElement.value = '';
            this.#selected_hostid = null;
            this.#dispatchSelectEvent(null);
            return;
        }
        
        this.#selected_hostid = host_id;
        
        // Find host by ID to get name
        const selectedHost = this.#hosts.find(host => host.hostid === host_id);
        if (selectedHost) {
            this.#inputElement.value = selectedHost.name;
            this.#dispatchSelectEvent(host_id);
        }
    }
    
    // Check if dropdown is visible in page
    isVisible() {
        if (!this.#container) return false;
        
        const rect = this.#container.getBoundingClientRect();
        return (
            rect.width > 0 &&
            rect.height > 0 &&
            this.#container.offsetParent !== null
        );
    }

    #updateOptionsPosition() {
        const inputRect = this.#inputElement.getBoundingClientRect();
        
        // Posicionar a lista diretamente abaixo do input
        this.#optionsList.style.top = (inputRect.bottom + 1) + 'px';
        this.#optionsList.style.left = inputRect.left + 'px';
        
        // Garantir que a lista tenha exatamente a mesma largura do input
        this.#optionsList.style.width = inputRect.width + 'px';
        this.#optionsList.style.minWidth = inputRect.width + 'px';
        this.#optionsList.style.maxWidth = inputRect.width + 'px';
        
        // Garantir que a lista não ultrapasse a borda inferior da janela
        const viewportHeight = window.innerHeight;
        const maxHeight = viewportHeight - inputRect.bottom - 10;
        this.#optionsList.style.maxHeight = Math.min(250, maxHeight) + 'px';
    }
} 