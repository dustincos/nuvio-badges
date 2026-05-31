// Nuvio Badges Studio core application logic

document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let badgeConfig = {
        groups: [],
        filters: []
    };

    // --- ELEMENTS ---
    const groupsContainer = document.getElementById('groups-accordion-container');
    const badgeCountText = document.getElementById('badge-count-badge');
    const jsonCodeBlock = document.getElementById('json-code-block');
    const testerInput = document.getElementById('test-stream-title');
    const simTitle = document.getElementById('n-stream-title');
    const simDesc = document.getElementById('n-stream-desc');
    const simBadgesRow = document.getElementById('n-badges-row');
    const addBadgeForm = document.getElementById('add-badge-form');
    
    // Tab switching
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Dynamic form elements
    const iconStyleRadio = document.getElementsByName('icon-style');
    const shieldsParams = document.getElementById('shields-params');
    const customUrlParam = document.getElementById('custom-url-param');
    const newBadgeColorPicker = document.getElementById('new-badge-color-picker');
    const newBadgeColorText = document.getElementById('new-badge-color-text');
    const newBadgeBorderPicker = document.getElementById('new-badge-border-picker');
    const newBadgeBorderText = document.getElementById('new-badge-border-text');

    // --- COLOR SYNCING ---
    const syncColorPicker = (picker, textInput) => {
        picker.addEventListener('input', (e) => {
            textInput.value = e.target.value.toUpperCase();
            updateFormStyles();
        });
        textInput.addEventListener('input', (e) => {
            let val = e.target.value;
            if (!val.startsWith('#')) val = '#' + val;
            if (val.length === 7 || val.length === 9) {
                picker.value = val.substring(0, 7);
            }
            updateFormStyles();
        });
    };
    syncColorPicker(newBadgeColorPicker, newBadgeColorText);
    syncColorPicker(newBadgeBorderPicker, newBadgeBorderText);

    // --- TAB NAVIGATION ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.add('hidden'));
            
            tab.classList.add('active');
            document.getElementById(tab.getAttribute('data-tab')).classList.remove('hidden');
        });
    });

    // Toggle Icon Style parameters
    iconStyleRadio.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'shields') {
                shieldsParams.classList.remove('hidden');
                customUrlParam.classList.add('hidden');
            } else {
                shieldsParams.classList.add('hidden');
                customUrlParam.classList.remove('hidden');
            }
        });
    });

    // --- LOAD DEFAULT CONFIG ---
    // Try fetching badges.json, fallback to embedded model if it fails (CORS locally)
    const loadConfig = async () => {
        try {
            const response = await fetch('./badges.json');
            if (response.ok) {
                badgeConfig = await response.json();
                console.log('✅ Loaded badges.json dynamically');
            } else {
                throw new Error('Local load failed');
            }
        } catch (e) {
            console.log('⚠️ Fetch failed. Falling back to embedded configuration data.');
            badgeConfig = getEmbeddedFallbackConfig();
        }
        initApp();
    };

    // --- INITIALIZE APPLICATION ---
    const initApp = () => {
        renderAccordion();
        updateJSONViewer();
        runLiveMatchTester();
    };

    // --- RENDER GROUPS & FILTERS ---
    const renderAccordion = () => {
        groupsContainer.innerHTML = '';
        
        if (!badgeConfig.groups || badgeConfig.groups.length === 0) {
            groupsContainer.innerHTML = '<div class="loading-state">No group metadata available.</div>';
            return;
        }

        badgeConfig.groups.forEach((group, index) => {
            const accordionItem = document.createElement('div');
            accordionItem.className = `accordion-item ${group.isExpanded ? 'open' : ''}`;
            accordionItem.id = `group-item-${group.id}`;

            const header = document.createElement('div');
            header.className = 'accordion-header';
            header.innerHTML = `
                <div class="accordion-title">
                    <span class="accordion-indicator-dot" style="background-color: ${group.color || '#FFFFFF'}; box-shadow: 0 0 8px ${group.color || '#FFFFFF'}"></span>
                    <span>${group.name}</span>
                </div>
                <svg class="accordion-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            `;

            header.addEventListener('click', () => {
                const isOpen = accordionItem.classList.contains('open');
                accordionItem.classList.toggle('open');
                group.isExpanded = !isOpen;
                updateJSONViewer();
            });

            const body = document.createElement('div');
            body.className = 'accordion-body';

            const filtersInGroup = badgeConfig.filters.filter(f => f.groupId === group.id);
            
            if (filtersInGroup.length === 0) {
                body.innerHTML = '<p class="loading-state">No active filters in this category.</p>';
            } else {
                const listContainer = document.createElement('div');
                listContainer.className = 'badge-list-container';

                filtersInGroup.forEach(filter => {
                    const item = document.createElement('div');
                    item.className = 'badge-list-item';
                    
                    // High-DPI preview resolution enhancement
                    let previewUrl = filter.imageURL;
                    if (previewUrl && previewUrl.includes('shields.io') && !previewUrl.includes('scale=')) {
                        previewUrl += previewUrl.includes('?') ? '&scale=2' : '?scale=2';
                    }

                    item.innerHTML = `
                        <input type="checkbox" class="badge-checkbox" data-id="${filter.id}" ${filter.isEnabled ? 'checked' : ''}>
                        <div class="badge-info">
                            <span class="badge-label-text">${filter.name}</span>
                            <span class="badge-pattern-text">${filter.pattern}</span>
                        </div>
                        <div class="badge-preview-cell">
                            ${previewUrl ? `<img class="badge-preview-img" src="${previewUrl}" alt="${filter.name}">` : `<span class="badge-preview-chip" style="background-color: ${filter.tagColor || 'transparent'}; border: 1px solid ${filter.borderColor || 'transparent'}; color: ${filter.textColor || '#FFFFFF'}">${filter.name}</span>`}
                        </div>
                        <button class="badge-action-btn" data-id="${filter.id}">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                    `;

                    // Checkbox toggle
                    item.querySelector('.badge-checkbox').addEventListener('change', (e) => {
                        filter.isEnabled = e.target.checked;
                        updateJSONViewer();
                        runLiveMatchTester();
                    });

                    // Delete button
                    item.querySelector('.badge-action-btn').addEventListener('click', () => {
                        badgeConfig.filters = badgeConfig.filters.filter(f => f.id !== filter.id);
                        renderAccordion();
                        updateJSONViewer();
                        runLiveMatchTester();
                    });

                    listContainer.appendChild(item);
                });
                body.appendChild(listContainer);
            }

            accordionItem.appendChild(header);
            accordionItem.appendChild(body);
            groupsContainer.appendChild(accordionItem);
        });

        // Update active badge display stats
        const activeCount = badgeConfig.filters.filter(f => f.isEnabled).length;
        badgeCountText.textContent = `${activeCount} / ${badgeConfig.filters.length} Enabled`;
    };

    // --- JSON INSPECTOR VIEW ---
    const updateJSONViewer = () => {
        const cleanJSON = JSON.stringify(badgeConfig, null, 2);
        jsonCodeBlock.textContent = cleanJSON;
    };

    // --- LIVE SIMULATED MATCHING ENGINE ---
    const runLiveMatchTester = () => {
        const streamStr = testerInput.value.trim();
        if (!streamStr) {
            simTitle.textContent = "Untitled Stream";
            simDesc.textContent = "No metadata";
            simBadgesRow.innerHTML = '';
            return;
        }

        // Mock parser split details (similar to StreamsRepository.kt parsing)
        const parts = streamStr.split('|').map(s => s.trim());
        const providerName = parts[0] || 'Unknown Source';
        
        simTitle.textContent = parts.slice(0, 2).join(' | ');

        // Construct simulated description components
        let size = '1.82 GB';
        let quality = '1080p';
        let language = 'Multi';

        if (streamStr.toLowerCase().includes('4k') || streamStr.toLowerCase().includes('2160p')) {
            quality = '4K';
            size = '14.50 GB';
        } else if (streamStr.toLowerCase().includes('720p')) {
            quality = '720p';
            size = '740 MB';
        }

        if (streamStr.toLowerCase().includes('french')) language = 'French';
        else if (streamStr.toLowerCase().includes('spanish')) language = 'Spanish';

        simDesc.textContent = `${quality} • ${size} • ${language}`;

        // Matches builder
        simBadgesRow.innerHTML = '';
        const activeFilters = badgeConfig.filters.filter(f => f.isEnabled);

        activeFilters.forEach(filter => {
            try {
                // Regex parsing with case-insensitive option (?i)
                let cleanedPattern = filter.pattern;
                let flags = 'g';
                
                if (cleanedPattern.startsWith('(?i)')) {
                    flags += 'i';
                    cleanedPattern = cleanedPattern.substring(4);
                }

                const regex = new RegExp(cleanedPattern, flags);
                
                // Nuvio matches against full Title + Description candidate strings
                const combinedCandidate = `${streamStr} ${quality} ${size} ${language}`;
                
                if (regex.test(combinedCandidate)) {
                    // Create visual chip preview
                    const chip = document.createElement('div');
                    chip.className = 'n-badge-chip';
                    
                    // Parse ARGB colors for web styling
                    const webBgColor = parseARGBtoRGBA(filter.tagColor);
                    const webBorderColor = parseARGBtoRGBA(filter.borderColor);
                    const webTextColor = parseARGBtoRGBA(filter.textColor) || '#FFFFFF';

                    if (filter.tagStyle === 'filled') {
                        chip.style.backgroundColor = webBgColor || '#27C04F';
                    } else if (filter.tagStyle === 'outlined') {
                        chip.style.border = `1px solid ${webBorderColor || '#00D2FF'}`;
                    } else if (filter.tagStyle === 'filled and bordered') {
                        chip.style.backgroundColor = webBgColor || 'rgba(255,255,255,0.05)';
                        chip.style.border = `1px solid ${webBorderColor || '#FFFFFF'}`;
                    }
                    
                    chip.style.color = webTextColor;

                    // Support dynamic retina scaling for dynamic shields
                    let finalImageURL = filter.imageURL;
                    if (finalImageURL && finalImageURL.includes('shields.io')) {
                        finalImageURL += finalImageURL.includes('?') ? '&scale=3' : '?scale=3';
                    }

                    if (finalImageURL) {
                        chip.innerHTML = `<img src="${finalImageURL}" alt="${filter.name}">`;
                    } else {
                        chip.textContent = filter.name;
                        chip.style.fontSize = '10px';
                        chip.style.fontWeight = 'bold';
                    }

                    simBadgesRow.appendChild(chip);
                }
            } catch (err) {
                console.error(`Invalid regex rule for badge ${filter.name}:`, err);
            }
        });
    };

    testerInput.addEventListener('input', runLiveMatchTester);

    // --- FORM SUBMISSION (ADD BADGE) ---
    addBadgeForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const badgeName = document.getElementById('new-badge-name').value.trim();
        const badgeId = document.getElementById('new-badge-id').value.trim();
        const badgePattern = document.getElementById('new-badge-pattern').value.trim();
        const badgeGroup = document.getElementById('new-badge-group').value;
        const iconStyle = document.querySelector('input[name="icon-style"]:checked').value;
        
        let imageURL = '';
        let tagColor = '#FF00D2FF';
        let borderColor = '#FF00D2FF';
        let textColor = '#00D2FF';
        const tagStyle = document.getElementById('new-badge-style').value;

        if (iconStyle === 'shields') {
            const shieldLabel = document.getElementById('new-badge-label').value.trim() || badgeName;
            const shieldColor = newBadgeColorText.value.trim().replace('#', '');
            
            // Generate exact shields.io dynamic path
            const formattedLabel = encodeURIComponent(shieldLabel.replace(/_/g, ' '));
            imageURL = `https://&scale=3`;
            
            tagColor = parseRGBtoARGB(newBadgeColorText.value.trim());
            borderColor = parseRGBtoARGB(newBadgeBorderText.value.trim());
            textColor = parseRGBtoARGB(newBadgeColorText.value.trim());
        } else {
            imageURL = document.getElementById('new-badge-imageurl').value.trim();
            tagColor = '#00000000'; // Transparent default
            borderColor = parseRGBtoARGB(newBadgeBorderText.value.trim());
            textColor = '#FFFFFFFF';
        }

        const newFilter = {
            borderColor: borderColor,
            groupId: badgeGroup,
            id: badgeId,
            imageURL: imageURL,
            isEnabled: true,
            name: badgeName,
            pattern: badgePattern,
            tagColor: tagColor,
            tagStyle: tagStyle,
            textColor: textColor,
            type: "filter"
        };

        // Add filter, trigger UI reload, switch back to list view
        badgeConfig.filters.push(newFilter);
        
        // Find if this group accordion item is open
        const groupObj = badgeConfig.groups.find(g => g.id === badgeGroup);
        if (groupObj) groupObj.isExpanded = true;

        renderAccordion();
        updateJSONViewer();
        runLiveMatchTester();

        // Reset form details and switch view tab
        addBadgeForm.reset();
        newBadgeColorText.value = '#00FFFF';
        newBadgeColorPicker.value = '#00FFFF';
        newBadgeBorderText.value = '#00FFFF';
        newBadgeBorderPicker.value = '#00FFFF';
        
        document.querySelector('[data-tab="tab-edit"]').click();
    });

    // --- CODES AND PARSERS ---
    const parseARGBtoRGBA = (argbStr) => {
        if (!argbStr) return null;
        let hex = argbStr.trim().replace('#', '');
        
        if (hex.length === 8) {
            const a = parseInt(hex.substring(0, 2), 16) / 255;
            const r = parseInt(hex.substring(2, 4), 16);
            const g = parseInt(hex.substring(4, 6), 16);
            const b = parseInt(hex.substring(6, 8), 16);
            return `rgba(${r}, ${g}, ${b}, ${a})`;
        } else if (hex.length === 6) {
            return `#${hex}`;
        }
        return null;
    };

    const parseRGBtoARGB = (hexStr) => {
        if (!hexStr) return '#FFFFFFFF';
        let hex = hexStr.trim().replace('#', '').toUpperCase();
        if (hex.length === 6) {
            return `#FF${hex}`;
        }
        return `#${hex}`;
    };

    const updateFormStyles = () => {
        // Subtle color style custom visual updates if needed
    };

    // --- DOWNLOAD / EXPORT ACTIONS ---
    document.getElementById('btn-export-json').addEventListener('click', () => {
        const jsonStr = JSON.stringify(badgeConfig, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'badges.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    document.getElementById('btn-copy-json').addEventListener('click', () => {
        const jsonStr = JSON.stringify(badgeConfig, null, 2);
        navigator.clipboard.writeText(jsonStr).then(() => {
            const btn = document.getElementById('btn-copy-json');
            const originalText = btn.innerHTML;
            btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 2000);
        });
    });

    // --- EMBEDDED CONFIG FALLBACKPreserve current state in case relative file fails offline ---
    const getEmbeddedFallbackConfig = () => {
        return {
          "groups": [
            {
              "id": "gq",
              "name": "Quality",
              "color": "#FF27C04F",
              "isExpanded": true
            },
            {
              "id": "gr",
              "name": "Resolution",
              "color": "#FFFFBE01",
              "isExpanded": true
            },
            {
              "id": "gv",
              "name": "Visual",
              "color": "#FFFF6B6B",
              "isExpanded": true
            },
            {
              "id": "ga",
              "name": "Audio",
              "color": "#FF45B7D1",
              "isExpanded": true
            },
            {
              "id": "gc",
              "name": "Channels",
              "color": "#FFFFD700",
              "isExpanded": true
            },
            {
              "id": "gl",
              "name": "Language",
              "color": "#FF4ECDC4",
              "isExpanded": true
            },
            {
              "id": "gp",
              "name": "Providers",
              "color": "#FF00FFFF",
              "isExpanded": true
            }
          ],
          "filters": [
            {
              "borderColor": "#FF00FF37",
              "groupId": "gq",
              "id": "q-r",
              "imageURL": "https://raw.githubusercontent.com/9mousaa/BetterFormatter/main/images/colored-remux.png",
              "isEnabled": true,
              "name": "Remux",
              "pattern": "(?i)\\bremux\\b",
              "tagColor": "#E600E932",
              "tagStyle": "filled",
              "textColor": "#27C04F",
              "type": "filter"
            },
            {
              "borderColor": "#FF00FF37",
              "groupId": "gq",
              "id": "q-b",
              "imageURL": "https://raw.githubusercontent.com/9mousaa/BetterFormatter/main/images/colored-bluray.png",
              "isEnabled": true,
              "name": "BluRay",
              "pattern": "(?i)^(?=.*(?:bluray|blu-ray))(?!.*remux)",
              "tagColor": "#E600E932",
              "tagStyle": "filled",
              "textColor": "#27C04F",
              "type": "filter"
            },
            {
              "borderColor": "#FF00FF37",
              "groupId": "gq",
              "id": "q-w",
              "imageURL": "https://raw.githubusercontent.com/9mousaa/BetterFormatter/main/images/colored-webdl.png",
              "isEnabled": true,
              "name": "WebDL",
              "pattern": "(?i)\\b(?:web[-_. ]?dl|webdl|webrip|web-rip)\\b",
              "tagColor": "#E600E932",
              "tagStyle": "filled",
              "textColor": "#27C04F",
              "type": "filter"
            },
            {
              "borderColor": "#FF00FF37",
              "groupId": "gv",
              "id": "v-seadex",
              "imageURL": "https://raw.githubusercontent.com/9mousaa/BetterFormatter/main/images/colored-SeaDex.png",
              "isEnabled": true,
              "name": "SeaDex",
              "pattern": "(?i)\\b(?:seadex|best[\\s._-]?release|alt[\\s._-]?(?:best[\\s._-]?)?release)\\b|ᴀʟᴛ ʀᴇʟᴇᴀsᴇ|ʙᴇsᴛ ʀᴇʟᴇᴀsᴇ",
              "tagColor": "#E600E932",
              "tagStyle": "filled",
              "textColor": "#27C04F",
              "type": "filter"
            },
            {
              "groupId": "gr",
              "id": "r-4k",
              "imageURL": "https://raw.githubusercontent.com/nobnobz/Omni-Template-Bot-Bid-Raiser/main/Other/regex%20tags/4k.png",
              "isEnabled": true,
              "name": "4K",
              "pattern": "(?i)^(?=.*(?:2160[pi]?|4k|uhd))(?!.*(?:1080[pi]?|720[pi]?))",
              "tagColor": "#FFBE01",
              "tagStyle": "filled",
              "textColor": "#FFBE01",
              "type": "filter",
              "borderColor": "#FFBE01"
            },
            {
              "groupId": "gr",
              "id": "r-1080",
              "imageURL": "https://raw.githubusercontent.com/nobnobz/Omni-Template-Bot-Bid-Raiser/main/Other/regex%20tags/1080p.png",
              "isEnabled": true,
              "name": "1080p",
              "pattern": "(?i)\\b1080[pi]?\\b",
              "tagColor": "#FF6904",
              "tagStyle": "filled",
              "textColor": "#FF9A3D",
              "type": "filter",
              "borderColor": "#FF6904"
            },
            {
              "groupId": "gr",
              "id": "r-720",
              "imageURL": "https://raw.githubusercontent.com/nobnobz/Omni-Template-Bot-Bid-Raiser/main/Other/regex%20tags/720p.png",
              "isEnabled": true,
              "name": "720p",
              "pattern": "(?i)\\b720[pi]?\\b",
              "tagColor": "#FB411C",
              "tagStyle": "filled",
              "textColor": "#FF9A3D",
              "type": "filter",
              "borderColor": "#FB411C"
            },
            {
              "borderColor": "#FFBE01",
              "groupId": "gv",
              "id": "a-dv",
              "imageURL": "https://raw.githubusercontent.com/nobnobz/Omni-Template-Bot-Bid-Raiser/main/Other/regex%20tags/DV.png",
              "isEnabled": true,
              "name": "DV",
              "pattern": "(?i)\\b(?:dv|dovi|dolby[\\s._-]?vision)\\b",
              "tagColor": "#FFBE01",
              "tagStyle": "filled",
              "textColor": "#0e0e0e",
              "type": "filter"
            },
            {
              "borderColor": "#FFBE01",
              "groupId": "gv",
              "id": "v-hdr10p",
              "imageURL": "https://raw.githubusercontent.com/nobnobz/Omni-Template-Bot-Bid-Raiser/main/Other/regex%20tags/HDR10Plus.png",
              "isEnabled": true,
              "name": "HDR10+",
              "pattern": "(?i)^(?!.*\\b(?:dv|dovi|dolby[\\s._-]?vision)\\b)(?=.*hdr[\\s._-]?10[\\s._-]?(?:\\\\+|plus|p))",
              "tagColor": "#FFBE01",
              "tagStyle": "filled",
              "textColor": "#0e0e0e",
              "type": "filter"
            },
            {
              "borderColor": "#FFBE01",
              "groupId": "gv",
              "id": "v-hdr10",
              "imageURL": "https://raw.githubusercontent.com/nobnobz/Omni-Template-Bot-Bid-Raiser/main/Other/regex%20tags/HDR10.png",
              "isEnabled": true,
              "name": "HDR10",
              "pattern": "(?i)^(?!.*\\b(?:dv|dovi|dolby[\\s._-]?vision)\\b)(?=.*hdr[\\s._-]?10)(?!.*hdr[\\s._-]?10[\\s._-]?(?:\\\\+|plus|p))",
              "tagColor": "#FFBE01",
              "tagStyle": "filled",
              "textColor": "#FFFFFF",
              "type": "filter"
            },
            {
              "borderColor": "#FFBE01",
              "groupId": "gv",
              "id": "v-hdr",
              "imageURL": "https://raw.githubusercontent.com/nobnobz/Omni-Template-Bot-Bid-Raiser/main/Other/regex%20tags/HDR.png",
              "isEnabled": true,
              "name": "HDR",
              "pattern": "(?i)^(?!.*\\b(?:dv|dovi|dolby[\\s._-]?vision)\\b)(?=.*\\bHDR\\b)(?!.*hdr[\\s._-]?10)",
              "tagColor": "#FFBE01",
              "tagStyle": "filled",
              "textColor": "#FFFFFF",
              "type": "filter"
            },
            {
              "borderColor": "#FF858283",
              "groupId": "gv",
              "id": "v-imax-e",
              "imageURL": "https://raw.githubusercontent.com/9mousaa/BetterFormatter/main/images/IMAX-enhanced.png",
              "isEnabled": true,
              "name": "IMAX Enhanced",
              "pattern": "(?i)\\bimax[\\s._-]?enhanced\\b",
              "tagColor": "#33FFFFFF",
              "tagStyle": "filled and bordered",
              "textColor": "#FFFFFF",
              "type": "filter"
            },
            {
              "groupId": "gv",
              "id": "v-imax",
              "imageURL": "https://github.com/nobnobz/Omni-Template-Bot-Bid-Raiser/blob/main/Other/regex%20tags/IMAXv2.PNG?raw=true",
              "isEnabled": true,
              "name": "IMAX",
              "pattern": "(?i)^(?=.*\\bIMAX\\b)(?!.*enhanced)",
              "tagColor": "#FFBE01",
              "tagStyle": "filled",
              "textColor": "#FFBE01",
              "type": "filter",
              "borderColor": "#FFBE01"
            },
            {
              "borderColor": "#00000000",
              "groupId": "ga",
              "id": "a-at-dv",
              "imageURL": "https://raw.githubusercontent.com/9mousaa/BetterFormatter/main/images/atmos-vision.png",
              "isEnabled": false,
              "name": "Atmos+DV",
              "pattern": "(?i)^(?=.*\\batmos\\b)(?=.*\\b(?:dv|dovi|dolby[\\s._-]?vision)\\b)",
              "tagColor": "#00000000",
              "tagStyle": "filled and bordered",
              "textColor": "#FFFFFF",
              "type": "filter"
            },
            {
              "borderColor": "#FFFFFF",
              "groupId": "ga",
              "id": "a-th",
              "imageURL": "https://raw.githubusercontent.com/nobnobz/Omni-Template-Bot-Bid-Raiser/main/Other/regex%20tags/TrueHD.png",
              "isEnabled": true,
              "name": "TrueHD",
              "pattern": "(?i)^(?=.*\\btrue[\\s._-]?hd\\b)(?!.*\\batmos\\b)(?!.*\\b(?:dv|dovi|dolby[\\s._-]?vision)\\b)",
              "tagColor": "#FFFFFF",
              "tagStyle": "filled",
              "textColor": "#0e0e0e",
              "type": "filter"
            },
            {
              "borderColor": "#FFFFFF",
              "groupId": "ga",
              "id": "a-at",
              "imageURL": "https://raw.githubusercontent.com/nobnobz/Omni-Template-Bot-Bid-Raiser/main/Other/regex%20tags/Atmos.png",
              "isEnabled": true,
              "name": "Atmos",
              "pattern": "(?i)\\batmos\\b",
              "tagColor": "#FFFFFF",
              "tagStyle": "filled",
              "textColor": "#0e0e0e",
              "type": "filter"
            },
            {
              "borderColor": "#00000000",
              "groupId": "ga",
              "id": "a-th-dv",
              "imageURL": "https://raw.githubusercontent.com/9mousaa/BetterFormatter/main/images/truehd-vision.png",
              "isEnabled": false,
              "name": "TrueHD+DV",
              "pattern": "(?i)^(?=.*\\btrue[\\s._-]?hd\\b)(?!.*\\batmos\\b)(?=.*\\b(?:dv|dovi|dolby[\\s._-]?vision)\\b)",
              "tagColor": "#00000000",
              "tagStyle": "filled and bordered",
              "textColor": "#FFFFFF",
              "type": "filter"
            },
            {
              "borderColor": "#00000000",
              "groupId": "ga",
              "id": "a-dp-dv",
              "imageURL": "https://raw.githubusercontent.com/9mousaa/BetterFormatter/main/images/digitalplus-vision.png",
              "isEnabled": false,
              "name": "DD++DV",
              "pattern": "(?i)^(?=.*(?:\\bddp|\\bdd\\+|\\beac-?3|\\be-?ac-?3))(?!.*\\batmos\\b)(?!.*\\btrue[\\s._-]?hd\\b)(?=.*\\b(?:dv|dovi|dolby[\\s._-]?vision)\\b)",
              "tagColor": "#00000000",
              "tagStyle": "filled and bordered",
              "textColor": "#FFFFFF",
              "type": "filter"
            },
            {
              "borderColor": "#FFFFFF",
              "groupId": "ga",
              "id": "a-dtsx",
              "imageURL": "https://raw.githubusercontent.com/nobnobz/Omni-Template-Bot-Bid-Raiser/main/Other/regex%20tags/dtsx.png",
              "isEnabled": true,
              "name": "DTS:X",
              "pattern": "(?i)\\bdts[-_.: ]?x\\b",
              "tagColor": "#FFFFFF",
              "tagStyle": "filled",
              "textColor": "#0e0e0e",
              "type": "filter"
            },
            {
              "borderColor": "#FFFFFF",
              "groupId": "ga",
              "id": "a-dtsma",
              "imageURL": "https://raw.githubusercontent.com/nobnobz/Omni-Template-Bot-Bid-Raiser/main/Other/regex%20tags/dtsHDMA.png",
              "isEnabled": true,
              "name": "DTS-HD MA",
              "pattern": "(?i)^(?=.*\\bdts[-_. ]?(?:hd[-_. ]?)?ma\\b)(?!.*\\bdts[-_.: ]?x\\b)",
              "tagColor": "#FFFFFF",
              "tagStyle": "filled",
              "textColor": "#0e0e0e",
              "type": "filter"
            },
            {
              "borderColor": "#FFFFFF",
              "groupId": "ga",
              "id": "a-dtshd",
              "imageURL": "https://raw.githubusercontent.com/nobnobz/Omni-Template-Bot-Bid-Raiser/main/Other/regex%20tags/dtsHD.png",
              "isEnabled": true,
              "name": "DTS-HD",
              "pattern": "(?i)^(?=.*\\bdts[-_. ]?hd\\b)(?!.*\\bdts[-_. ]?(?:hd[-_. ]?)?ma\\b)(?!.*\\bdts[-_.: ]?x\\b)",
              "tagColor": "#FFFFFF",
              "tagStyle": "filled",
              "textColor": "#0e0e0e",
              "type": "filter"
            },
            {
              "borderColor": "#FFFFFF",
              "groupId": "ga",
              "id": "a-dts",
              "imageURL": "https://raw.githubusercontent.com/nobnobz/Omni-Template-Bot-Bid-Raiser/main/Other/regex%20tags/dts.png",
              "isEnabled": true,
              "name": "DTS",
              "pattern": "(?i)^(?=.*\\bDTS\\b)(?!.*\\bdts[-_. ]?(?:hd|ma|xll|x)\\b)",
              "tagColor": "#FFFFFF",
              "tagStyle": "filled",
              "textColor": "#0e0e0e",
              "type": "filter"
            },
            {
              "borderColor": "#FFFFFF",
              "groupId": "ga",
              "id": "a-dp",
              "imageURL": "https://raw.githubusercontent.com/nobnobz/Omni-Template-Bot-Bid-Raiser/main/Other/regex%20tags/DDPLUS.png",
              "isEnabled": true,
              "name": "DD+",
              "pattern": "(?i)^(?=.*(?:\\bddp|\\bdd\\+|\\beac-?3|\\be-?ac-?3))(?!.*\\batmos\\b)(?!.*\\btrue[\\s._-]?hd\\b)(?!.*\\b(?:dv|dovi|dolby[\\s._-]?vision)\\b)",
              "tagColor": "#FFFFFF",
              "tagStyle": "filled",
              "textColor": "#0e0e0e",
              "type": "filter"
            },
            {
              "borderColor": "#00000000",
              "groupId": "ga",
              "id": "a-dd-dv",
              "imageURL": "https://raw.githubusercontent.com/9mousaa/BetterFormatter/main/images/digital-vision.png",
              "isEnabled": false,
              "name": "DD+DV",
              "pattern": "(?i)^(?=.*\\b(?:dd[25][. ][01]|dd[^p+a-z]\\b|\\bac-?3)\\b)(?!.*(?:\\bddp|\\bdd\\+|\\beac-?3|\\be-?ac-?3))(?!.*\\btrue[\\s._-]?hd\\b)(?!.*\\batmos\\b)(?=.*\\b(?:dv|dovi|dolby[\\s._-]?vision)\\b)",
              "tagColor": "#00000000",
              "tagStyle": "filled and bordered",
              "textColor": "#FFFFFF",
              "type": "filter"
            },
            {
              "borderColor": "#FFFFFF",
              "groupId": "ga",
              "id": "a-dd",
              "imageURL": "https://raw.githubusercontent.com/nobnobz/Omni-Template-Bot-Bid-Raiser/main/Other/regex%20tags/DD.png",
              "isEnabled": true,
              "name": "DD",
              "pattern": "(?i)^(?=.*\\b(?:dd[25][. ][01]|dd[^p+a-z]\\b|\\bac-?3)\\b)(?!.*(?:\\bddp|\\bdd\\+|\\beac-?3|\\be-?ac-?3))(?!.*\\btrue[\\s._-]?hd\\b)(?!.*\\batmos\\b)(?!.*\\b(?:dv|dovi|dolby[\\s._-]?vision)\\b)",
              "tagColor": "#FFFFFF",
              "tagStyle": "filled",
              "textColor": "#0e0e0e",
              "type": "filter"
            },
            {
              "borderColor": "#FFFFFF",
              "groupId": "gc",
              "id": "ch-71",
              "imageURL": "https://raw.githubusercontent.com/nobnobz/Omni-Template-Bot-Bid-Raiser/main/Other/regex%20tags/71.png",
              "isEnabled": true,
              "name": "7.1",
              "pattern": "[^0-9][7-8][. ][01](?![0-9])",
              "tagColor": "#FFFFFF",
              "tagStyle": "filled",
              "textColor": "#0e0e0e",
              "type": "filter"
            },
            {
              "groupId": "gc",
              "id": "ch-61",
              "imageURL": "https://raw.githubusercontent.com/nobnobz/Omni-Template-Bot-Bid-Raiser/main/Other/regex%20tags/61.png",
              "isEnabled": true,
              "name": "6.1",
              "pattern": "(?i)(?=.*[^0-9]6[ .][0-1]\\b)(?!.*[^0-9][7-8][ .][0-1]\\b)(?!.*[^0-9]5[ .][0-1]\\b)(?!.*(?<!repac)[^0-9][1-4][ .][0-1]\\b|\\\\b(Stereo|Mono)\\\\b)",
              "tagColor": "#FFFFFF",
              "tagStyle": "filled",
              "textColor": "#0e0e0e",
              "type": "filter",
              "borderColor": "#FFFFFF"
            },
            {
              "borderColor": "#FFFFFF",
              "groupId": "gc",
              "id": "ch-51",
              "imageURL": "https://raw.githubusercontent.com/nobnobz/Omni-Template-Bot-Bid-Raiser/main/Other/regex%20tags/51.png",
              "isEnabled": true,
              "name": "5.1",
              "pattern": "^(?=.*[^0-9]5[. ][01](?![0-9]))(?!.*[^0-9][7-8][. ][01](?![0-9]))",
              "tagColor": "#FFFFFF",
              "tagStyle": "filled",
              "textColor": "#0e0e0e",
              "type": "filter"
            },
            {
              "borderColor": "#00000000",
              "groupId": "gl",
              "id": "l-en",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "🇬🇧",
              "pattern": "(?i)\\benglish\\b|\\beng\\b",
              "tagColor": "#00000000",
              "tagStyle": "filled and bordered",
              "textColor": "#80FFFFFF",
              "type": "filter"
            },
            {
              "borderColor": "#00000000",
              "groupId": "gl",
              "id": "l-es",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "🇪🇸",
              "pattern": "(?i)\\bspanish\\b|\\bspa\\b",
              "tagColor": "#00000000",
              "tagStyle": "filled and bordered",
              "textColor": "#80FFFFFF",
              "type": "filter"
            },
            {
              "borderColor": "#00000000",
              "groupId": "gl",
              "id": "l-fr",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "🇫🇷",
              "pattern": "(?i)\\bfrench\\b|\\bfra\\b|\\bfr\\b|\\bvff\\b|\\bvfq\\b",
              "tagColor": "#00000000",
              "tagStyle": "filled and bordered",
              "textColor": "#80FFFFFF",
              "type": "filter"
            },
            {
              "borderColor": "#00000000",
              "groupId": "gl",
              "id": "l-de",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "🇩🇪",
              "pattern": "(?i)\\bgerman\\b|\\bdeu\\b",
              "tagColor": "#00000000",
              "tagStyle": "filled and bordered",
              "textColor": "#80FFFFFF",
              "type": "filter"
            },
            {
              "borderColor": "#00000000",
              "groupId": "gl",
              "id": "l-it",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "🇮🇹",
              "pattern": "(?i)\\bitalian\\b|\\bita\\b",
              "tagColor": "#00000000",
              "tagStyle": "filled and bordered",
              "textColor": "#80FFFFFF",
              "type": "filter"
            },
            {
              "borderColor": "#00000000",
              "groupId": "gl",
              "id": "l-pt",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "🇧🇷",
              "pattern": "(?i)\\bportuguese\\b|\\bpor\\b",
              "tagColor": "#00000000",
              "tagStyle": "filled and bordered",
              "textColor": "#80FFFFFF",
              "type": "filter"
            },
            {
              "borderColor": "#00000000",
              "groupId": "gl",
              "id": "l-ja",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "🇯🇵",
              "pattern": "(?i)\\bjapanese\\b|\\bjpn\\b|[぀-ゟ゠-ヿ]{3,}",
              "tagColor": "#00000000",
              "tagStyle": "filled and bordered",
              "textColor": "#80FFFFFF",
              "type": "filter"
            },
            {
              "borderColor": "#00000000",
              "groupId": "gl",
              "id": "l-ko",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "🇰🇷",
              "pattern": "(?i)\\bkorean\\b|\\bkor\\b|[가-힯]{3,}",
              "tagColor": "#00000000",
              "tagStyle": "filled and bordered",
              "textColor": "#80FFFFFF",
              "type": "filter"
            },
            {
              "borderColor": "#00000000",
              "groupId": "gl",
              "id": "l-zh",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "🇨🇳",
              "pattern": "(?i)\\bchinese\\b|\\bchi\\b|[一-鿿]{3,}",
              "tagColor": "#00000000",
              "tagStyle": "filled and bordered",
              "textColor": "#80FFFFFF",
              "type": "filter"
            },
            {
              "borderColor": "#00000000",
              "groupId": "gl",
              "id": "l-hi",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "🇮🇳",
              "pattern": "(?i)\\bhindi\\b|\\bhin\\b|[ऀ-ॿ]{3,}",
              "tagColor": "#00000000",
              "tagStyle": "filled and bordered",
              "textColor": "#80FFFFFF",
              "type": "filter"
            },
            {
              "borderColor": "#00000000",
              "groupId": "gl",
              "id": "l-ar",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "🇸🇦",
              "pattern": "(?i)\\barabic\\b|\\bara\\b|[؀-ۿ]{3,}",
              "tagColor": "#00000000",
              "tagStyle": "filled and bordered",
              "textColor": "#80FFFFFF",
              "type": "filter"
            },
            {
              "borderColor": "#00000000",
              "groupId": "gl",
              "id": "l-ru",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "🇷🇺",
              "pattern": "(?i)\\brussian\\b|\\brus\\b|[Ѐ-ӿ]{3,}",
              "tagColor": "#00000000",
              "tagStyle": "filled and bordered",
              "textColor": "#80FFFFFF",
              "type": "filter"
            },
            {
              "borderColor": "#00000000",
              "groupId": "gl",
              "id": "l-mu",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "🌐",
              "pattern": "(?i)\\bmulti\\b|\\bdual[\\s._-]?audio\\b",
              "tagColor": "#00000000",
              "tagStyle": "filled and bordered",
              "textColor": "#80FFFFFF",
              "type": "filter"
            },
            {
              "borderColor": "#FF00D2FF",
              "groupId": "gp",
              "id": "p-vidlink",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "⚡ Vidlink",
              "pattern": "(?i)vidlink",
              "tagColor": "#FF00D2FF",
              "tagStyle": "outlined",
              "textColor": "#00D2FF",
              "type": "filter"
            },
            {
              "borderColor": "#FFFF0055",
              "groupId": "gp",
              "id": "p-moviebox",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "🎬 MovieBox",
              "pattern": "(?i)moviebox",
              "tagColor": "#FFFF0055",
              "tagStyle": "outlined",
              "textColor": "#FF0055",
              "type": "filter"
            },
            {
              "borderColor": "#FF7F00FF",
              "groupId": "gp",
              "id": "p-netmirror",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "📺 NetMirror",
              "pattern": "(?i)netmirror",
              "tagColor": "#FF7F00FF",
              "tagStyle": "outlined",
              "textColor": "#7F00FF",
              "type": "filter"
            },
            {
              "borderColor": "#FFFFD700",
              "groupId": "gp",
              "id": "p-4khdhub",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "🚀 4KHDHub",
              "pattern": "(?i)4khdhub",
              "tagColor": "#FFFFD700",
              "tagStyle": "outlined",
              "textColor": "#FFD700",
              "type": "filter"
            },
            {
              "borderColor": "#FF00FF66",
              "groupId": "gp",
              "id": "p-movix",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "🍿 Movix",
              "pattern": "(?i)movix",
              "tagColor": "#FF00FF66",
              "tagStyle": "outlined",
              "textColor": "#00FF66",
              "type": "filter"
            },
            {
              "borderColor": "#FFFF3300",
              "groupId": "gp",
              "id": "p-notorrent",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "🔗 NoTorrent",
              "pattern": "(?i)notorrent",
              "tagColor": "#FFFF3300",
              "tagStyle": "outlined",
              "textColor": "#FF3300",
              "type": "filter"
            },
            {
              "borderColor": "#FF9933FF",
              "groupId": "gp",
              "id": "p-playimdb",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "🎭 PlayImdb",
              "pattern": "(?i)playimdb",
              "tagColor": "#FF9933FF",
              "tagStyle": "outlined",
              "textColor": "#9933FF",
              "type": "filter"
            },
            {
              "borderColor": "#FF33CCFF",
              "groupId": "gp",
              "id": "p-videasy",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "⭐ Videasy",
              "pattern": "(?i)videasy",
              "tagColor": "#FF33CCFF",
              "tagStyle": "outlined",
              "textColor": "#33CCFF",
              "type": "filter"
            },
            {
              "borderColor": "#FFFF9900",
              "groupId": "gp",
              "id": "p-vidfast",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "⚡ VidFastPro",
              "pattern": "(?i)vidfast",
              "tagColor": "#FFFF9900",
              "tagStyle": "outlined",
              "textColor": "#FF9900",
              "type": "filter"
            },
            {
              "borderColor": "#FFCC00FF",
              "groupId": "gp",
              "id": "p-xpass",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "🔮 Xpass",
              "pattern": "(?i)xpass",
              "tagColor": "#FFCC00FF",
              "tagStyle": "outlined",
              "textColor": "#CC00FF",
              "type": "filter"
            },
            {
              "borderColor": "#FF00E5FF",
              "groupId": "gp",
              "id": "p-autoembed",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "💎 AutoEmbed",
              "pattern": "(?i)autoembed",
              "tagColor": "#FF00E5FF",
              "tagStyle": "outlined",
              "textColor": "#00E5FF",
              "type": "filter"
            },
            {
              "borderColor": "#FFFF0033",
              "groupId": "gp",
              "id": "p-dahmermovies",
              "imageURL": "https://&scale=3",
              "isEnabled": true,
              "name": "🔥 DahmerMovies",
              "pattern": "(?i)dahmermovies",
              "tagColor": "#FFFF0033",
              "tagStyle": "outlined",
              "textColor": "#FF0033",
              "type": "filter"
            }
          ]
        };
    };

    // --- LAUNCH ---
    loadConfig();
});
