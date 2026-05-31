document.addEventListener('DOMContentLoaded', () => {
    let presetConfig = {
        icon: 'colored',
        qual: 'bgb',
        dv: 'combo',
        hdr: 'nodv',
        desc: 'short'
    };

    let badgeConfig = {
        groups: [],
        filters: []
    };

    // DOM Element Selections
    const groupsContainer = document.getElementById('groups-accordion-container');
    const badgeCountText = document.getElementById('badge-count-badge');
    const jsonCodeBlock = document.getElementById('json-code-block');
    const testerInput = document.getElementById('test-stream-title');
    const previewListContainer = document.getElementById('dynamic-preview-list');
    const addBadgeForm = document.getElementById('add-badge-form');
    
    const segmentBtns = document.querySelectorAll('.segment-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    const iconStyleRadio = document.getElementsByName('icon-style');
    const shieldsParams = document.getElementById('shields-params');
    const customUrlParam = document.getElementById('custom-url-param');
    const newBadgeColorPicker = document.getElementById('new-badge-color-picker');
    const newBadgeColorText = document.getElementById('new-badge-color-text');
    const newBadgeBorderPicker = document.getElementById('new-badge-border-picker');
    const newBadgeBorderText = document.getElementById('new-badge-border-text');

    const imageBaseURL = 'https://raw.githubusercontent.com/dustincos/nuvio-badges/main/images/';

    const ST = {
        best: { bc: '#FF00FF37', bg: '#E600E932', tc: '#27C04F' },
        good: { bc: '#FF2D9943', bg: '#3300E932', tc: '#27C04F' },
        bad: { bc: '#FF9D613D', bg: '#33FF7728', tc: '#FF6904' },
        res: { bc: '#FF858283', bg: '#33FFFFFF', tc: '#FFFFFF' },
        tr: { bc: '#00000000', bg: '#00000000', tc: '#FFFFFF' },
        dim: { bc: '#00000000', bg: '#00000000', tc: '#80FFFFFF' },
    };

    const STREAMS = [
        { qual: 'Bluray Remux', title: 'Avatar Fire and Ash (2025)', size: '76 GB', fn: 'Avatar.Fire.and.Ash.2025.2160p.BluRay.REMUX.IMAX.DV.TrueHD.7.1.Atmos-FraMeSToR.mkv', pct: 99, res: '4K', hdr: null, dv: true, aud: 'atmos', ch: '7.1', src: 'remux', q: 'best', tier: 't1', imax: 'IMAX', seadex: false },
        { qual: 'Bluray', title: 'Avatar Fire and Ash (2025)', size: '18 GB', fn: 'Avatar.Fire.and.Ash.2025.2160p.BluRay.x265.HDR10.DTS-X.7.1-CtrlHD.mkv', pct: 90, res: '4K', hdr: 'HDR10', dv: false, aud: 'dtsx', ch: '7.1', src: 'bluray', q: 'good', tier: 't1', imax: null, seadex: false },
        { qual: 'Bluray', title: 'Demon Slayer S01·E01', size: '4 GB', fn: 'Demon.Slayer.2019.1080p.BluRay.DV.DDP5.1.Atmos-hallowed.mkv', pct: 80, res: '1080p', hdr: null, dv: true, aud: 'atmos', ch: '5.1', src: 'bluray', q: 'good', tier: 't2', imax: null, seadex: true },
        { qual: 'Web-Dl', title: 'Avatar Fire and Ash (2025)', size: '2 GB', fn: 'Avatar.Fire.and.Ash.2025.720p.WEB-DL.DD5.1.DV-RandomGrp.mkv', pct: 50, res: '720p', hdr: null, dv: true, aud: 'dd', ch: '5.1', src: 'webdl', q: 'ok', tier: 't3', imax: null, seadex: false }
    ];

    const getScaledImageURL = (url) => {
        if (!url || !url.includes('shields.io')) return url;
        if (url.includes('scale=')) {
            return url.replace(/scale=\d+/, 'scale=3');
        }
        return url + (url.includes('?') ? '&scale=3' : '?scale=3');
    };

    const bindColorPicker = (picker, textInput) => {
        picker.addEventListener('input', (e) => {
            textInput.value = e.target.value.toUpperCase();
        });
        textInput.addEventListener('input', (e) => {
            let val = e.target.value;
            if (!val.startsWith('#')) val = '#' + val;
            if (val.length === 7 || val.length === 9) {
                picker.value = val.substring(0, 7);
            }
        });
    };
    bindColorPicker(newBadgeColorPicker, newBadgeColorText);
    bindColorPicker(newBadgeBorderPicker, newBadgeBorderText);

    segmentBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            segmentBtns.forEach(b => {
                b.classList.remove('active');
                b.classList.add('outline', 'secondary');
            });
            btn.classList.add('active');
            btn.classList.remove('outline', 'secondary');
            
            tabContents.forEach(c => c.classList.add('hidden'));
            document.getElementById(btn.getAttribute('data-tab')).classList.remove('hidden');
        });
    });

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

    // Preset Option Click Binders
    document.querySelectorAll('.preset-opts').forEach(groupContainer => {
        groupContainer.querySelectorAll('.preset-opt').forEach(opt => {
            opt.addEventListener('click', () => {
                groupContainer.querySelectorAll('.preset-opt').forEach(sibling => {
                    sibling.classList.remove('active');
                });
                opt.classList.add('active');
                
                const group = groupContainer.getAttribute('data-group');
                const value = opt.getAttribute('data-value');
                presetConfig[group] = value;
                
                upd();
            });
        });
    });

    // --- FUNCTIONAL BADGES COMPILATION ENGINE ---
    const mk = (id, name, pat, img, st, gid) => {
        return {
            borderColor: st.bc,
            groupId: gid,
            id: id,
            imageURL: img ? imageBaseURL + img : '',
            isEnabled: true,
            name: name,
            pattern: pat,
            tagColor: st.bg,
            tagStyle: 'filled and bordered',
            textColor: st.tc,
            type: 'filter'
        };
    };

    const generateBadgeConfig = (C) => {
        const p = C.icon;
        const mono = p === 'mono';
        const T = [];
        const G = [];
        const qs = k => mono ? ST.res : ST[k];

        const dvR = '\\b(?:dv|dovi|dolby[\\s._-]?vision)\\b';
        const dvY = '(?=.*(?i)' + dvR + ')';
        const dvN = '(?!.*(?i)' + dvR + ')';
        const atmosR = '(?i)\\batmos\\b';
        const thR = '(?i)true[\\s._-]?hd';
        const ddpR = '(?i)(?:dd[p+]|e[\\s._-]?ac[\\s._-]?3)';
        const ddR = '(?i)(?:dd[^p+a-z]|(?<!e-)ac-?3)';

        // 1. Quality Category
        if (C.qual === 'bgb') {
            T.push(mk('q-br', 'Best Remux', '(?=.*\\u265b)(?=.*(?i)remux)', p + '-best-remux.png', qs('best'), 'gq'));
            T.push(mk('q-bb', 'Best BluRay', '(?=.*\\u265b)(?=.*(?i)(?:bluray|blu-ray))(?!.*(?i)remux)', p + '-best-bluray.png', qs('best'), 'gq'));
            T.push(mk('q-bw', 'Best WebDL', '(?=.*\\u265b)(?=.*(?i)(?:web[-_. ]?dl|webdl|webrip))', p + '-best-webdl.png', qs('best'), 'gq'));
            T.push(mk('q-gr', 'Good Remux', '(?=.*[\\u2b51\\u2726])(?=.*(?i)remux)', p + '-good-remux.png', qs('good'), 'gq'));
            T.push(mk('q-gb', 'Good BluRay', '(?=.*[\\u2b51\\u2726])(?=.*(?i)(?:bluray|blu-ray))(?!.*(?i)remux)', p + '-good-bluray.png', qs('good'), 'gq'));
            T.push(mk('q-gw', 'Good WebDL', '(?=.*[\\u2b51\\u2726])(?=.*(?i)(?:web[-_. ]?dl|webdl|webrip))', p + '-good-webdl.png', qs('good'), 'gq'));
            T.push(mk('q-bad', 'Bad', '[\\u25b3\\u2205]', p + '-Bad.png', qs('bad'), 'gq'));
        } else if (C.qual === 'tier') {
            const subs = ['\\u2081', '\\u2082', '\\u2083'];
            const srcs = [
                ['remux', 'Remux', '\\u0280\\u1d07\\u1d0d\\u1d1c\\u0445'],
                ['bluray', 'Bluray', '\\u0299\\u029f\\u1d1c\\u0280\\u1d00\\u028f'],
                ['webdl', 'WEB', '\\u1d21\\u1d07\\u0299']
            ];
            for (let i = 0; i < 3; i++) {
                const tn = 'T' + (i + 1);
                for (const [k, l, sc] of srcs) {
                    T.push(mk('q-' + k + '-t' + (i + 1), l + ' ' + tn, '(?:\\b' + l + ' ' + tn + '\\b|' + sc + ' \\u1d1b' + subs[i] + ')', p + '-icon-' + k + '-t' + (i + 1) + '.png', qs('best'), 'gq'));
                }
            }
        } else if (C.qual === 'src') {
            T.push(mk('q-r', 'Remux', '(?i)remux', p + '-remux.png', qs('best'), 'gq'));
            T.push(mk('q-b', 'BluRay', '(?=.*(?i)(?:bluray|blu-ray))(?!.*(?i)remux)', p + '-bluray.png', qs('best'), 'gq'));
            T.push(mk('q-w', 'WebDL', '(?i)(?:web[-_. ]?dl|webdl|webrip)', p + '-webdl.png', qs('best'), 'gq'));
        } else {
            // Percentages
            const hsl = (h, s, l) => {
                const a = s * Math.min(l, 1 - l);
                const f = n => {
                    const k = (n + h / 30) % 12;
                    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                };
                return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
            };
            const hx = (r, g, b) => ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
            const pctS = (p) => {
                const c = hsl((p / 100) * 120, 1, .45);
                const h = hx(...c);
                return { bc: '#66' + h, bg: '#33' + h, tc: '#FF' + h };
            };
            for (let i = 100; i >= 1; i--) {
                T.push(mk('p' + i, i + '%', '\\b' + i + '%', '', mono ? ST.res : pctS(i), 'gp'));
            }
            T.push(mk('q-r', 'Remux', '(?i)remux', p + '-remux.png', qs('best'), 'gq'));
            T.push(mk('q-b', 'BluRay', '(?=.*(?i)(?:bluray|blu-ray))(?!.*(?i)remux)', p + '-bluray.png', qs('best'), 'gq'));
            T.push(mk('q-w', 'WebDL', '(?i)(?:web[-_. ]?dl|webdl|webrip)', p + '-webdl.png', qs('best'), 'gq'));
        }

        // 1b. SeaDex - right after quality
        T.push(mk('v-seadex', 'SeaDex', '(?i)\\b(?:seadex|best[\\s._-]?release|alt[\\s._-]?(?:best[\\s._-]?)?release)\\b|\\u1d00\\u029f\\u1d1b \\u0280\\u1d07\\u029f\\u1d07\\u1d00s\\u1d07|\\u0299\\u1d07s\\u1d1b \\u0280\\u1d07\\u029f\\u1d07\\u1d00s\\u1d07', p + '-SeaDex.png', mono ? ST.res : ST.best, 'gv'));

        // 2. Resolution Category
        T.push(mk('r4', '4K', '(?i)^(?!.*\\b(?:1080[pi]?|720[pi]?)\\b).*?(?:\\b2160[pi]?\\b|\\b4k\\b|\\buhd\\b)', '4k.png', ST.res, 'gr'));
        T.push(mk('r1', '1080p', '(?i)\\b1080[pi]?\\b', '1080p.png', ST.res, 'gr'));
        T.push(mk('r7', '720p', '(?i)\\b720[pi]?\\b', '720p.png', ST.res, 'gr'));

        // 3. HDR Display Category (Dolby Vision exclusion logic)
        const hp = C.hdr === 'nodv' ? dvN : '';
        T.push(mk('h+', 'HDR10+', hp + '(?=.*(?i)hdr\\s*10\\s*(?:\\+|plus|p))', 'HDR10Plus.png', ST.res, 'gv'));
        T.push(mk('h1', 'HDR10', hp + '(?=.*(?i)hdr\\s*10)(?!.*(?i)hdr\\s*10\\s*(?:\\+|plus|p))', 'HDR10.png', ST.res, 'gv'));
        T.push(mk('hh', 'HDR', hp + '(?=.*(?i)\\bHDR\\b)(?!.*(?i)hdr\\s*10)', 'HDR.png', ST.res, 'gv'));

        // IMAX
        T.push(mk('v-imax-e', 'IMAX Enhanced', '(?i)\\bimax[\\s._-]?enhanced\\b', 'IMAX-enhanced.png', ST.res, 'gv'));
        T.push(mk('v-imax', 'IMAX', '(?i)^(?=.*\\bIMAX\\b)(?!.*enhanced)', 'IMAX.png', ST.res, 'gv'));

        // 4. Audio + Dolby Vision Combo Category
        if (C.dv === 'combo') {
            T.push(mk('a-at-dv', 'Atmos+DV', '(?=.*' + atmosR + ')' + dvY, 'atmos-vision.png', ST.tr, 'ga'));
            T.push(mk('a-at', 'Atmos', '(?=.*' + atmosR + ')' + dvN, 'atmos.png', ST.tr, 'ga'));
            T.push(mk('a-th-dv', 'TrueHD+DV', '(?=.*' + thR + ')(?!.*' + atmosR + ')' + dvY, 'truehd-vision.png', ST.tr, 'ga'));
            T.push(mk('a-th', 'TrueHD', '(?=.*' + thR + ')(?!.*' + atmosR + ')' + dvN, 'truehd.png', ST.tr, 'ga'));
            T.push(mk('a-dp-dv', 'DD+ DV', '(?=.*' + ddpR + ')(?!.*' + atmosR + ')(?!.*' + thR + ')' + dvY, 'digitalplus-vision.png', ST.tr, 'ga'));
            T.push(mk('a-dp', 'DD+', '(?=.*' + ddpR + ')(?!.*' + atmosR + ')(?!.*' + thR + ')' + dvN, 'digitalplus.png', ST.tr, 'ga'));
            T.push(mk('a-dd-dv', 'DD DV', '(?=.*' + ddR + ')(?!.*' + ddpR + ')(?!.*' + thR + ')(?!.*' + atmosR + ')' + dvY, 'digital-vision.png', ST.tr, 'ga'));
            T.push(mk('a-dd', 'DD', '(?=.*' + ddR + ')(?!.*' + ddpR + ')(?!.*' + thR + ')(?!.*' + atmosR + ')' + dvN, 'digital.png', ST.tr, 'ga'));
            T.push(mk('a-dv', 'DV', '(?=.*(?i)' + dvR + ')(?!.*' + atmosR + ')(?!.*' + thR + ')(?!.*' + ddpR + ')(?!.*' + ddR + ')', 'vision.png', ST.tr, 'gv'));
        } else {
            T.push(mk('a-dv', 'DV', '(?i)' + dvR, 'vision.png', ST.tr, 'gv'));
            T.push(mk('a-at', 'Atmos', atmosR, 'atmos.png', ST.tr, 'ga'));
            T.push(mk('a-th', 'TrueHD', '(?=.*' + thR + ')(?!.*' + atmosR + ')', 'truehd.png', ST.tr, 'ga'));
            T.push(mk('a-dp', 'DD+', '(?=.*' + ddpR + ')(?!.*' + atmosR + ')(?!.*' + thR + ')', 'digitalplus.png', ST.tr, 'ga'));
            T.push(mk('a-dd', 'DD', '(?=.*' + ddR + ')(?!.*' + ddpR + ')(?!.*' + thR + ')(?!.*' + atmosR + ')', 'digital.png', ST.tr, 'ga'));
        }

        // DTS Surround (DTS, DTS-HD, DTS-HD MA, DTS:X)
        T.push(mk('d-x', 'DTS:X', '(?i)\\bdts[-_.: ]?x\\b', 'dtsx.png', ST.res, 'ga'));
        T.push(mk('d-ma', 'DTS-HD MA', '(?i)\\bdts[-_. ]?(?:hd[-_. ]?ma|ma|xll)\\b', 'dtshdma.png', ST.res, 'ga'));
        T.push(mk('d-hd', 'DTS-HD', '(?i)\\bdts[-_. ]?hd\\b(?![-_. ]?ma)', 'dtshd.png', ST.res, 'ga'));
        T.push(mk('d-d', 'DTS', '(?=.*(?i)\\bDTS\\b)(?!.*(?i)dts[-_. ]?(?:hd|ma|xll|x))', 'dts.png', ST.res, 'ga'));

        // Surround Channels
        T.push(mk('c7', '7.1', '(?i)[^0-9][7-8][ .][0-1]', '7dot1.png', ST.tr, 'gc'));
        T.push(mk('c5', '5.1', '(?=.*(?i)[^0-9]5[ .][0-1])(?!.*(?i)[^0-9][7-8][ .][0-1])', '5dot1.png', ST.tr, 'gc'));

        // Languages
        const L = [
            ['en', '🇬🇧', '(?i)\\benglish\\b|\\beng\\b'],
            ['es', '🇪🇸', '(?i)\\bspanish\\b|\\bspa\\b'],
            ['fr', '🇫🇷', '(?i)\\bfrench\\b|\\bfra\\b'],
            ['de', '🇩🇪', '(?i)\\bgerman\\b|\\bdeu\\b'],
            ['it', '🇮🇹', '(?i)\\bitalian\\b|\\bita\\b'],
            ['pt', '🇧🇷', '(?i)\\bportuguese\\b|\\bpor\\b'],
            ['ja', '🇯🇵', '(?i)\\bjapanese\\b|\\bjpn\\b'],
            ['ko', '🇰🇷', '(?i)\\bkorean\\b|\\bkor\\b'],
            ['zh', '🇨🇳', '(?i)\\bchinese\\b|\\bchi\\b'],
            ['hi', '🇮🇳', '(?i)\\bhindi\\b|\\bhin\\b'],
            ['ar', '🇸🇦', '(?i)\\barabic\\b|\\bara\\b'],
            ['ru', '🇷🇺', '(?i)\\brussian\\b|\\brus\\b'],
            ['mu', '🌐', '(?i)\\bmulti\\b|\\bdual[\\s._-]?audio\\b']
        ];
        for (const [c, f, pt] of L) {
            T.push(mk('l-' + c, f, pt, '', ST.dim, 'gl'));
        }

        // Groups Structure
        if (C.qual === 'pct') {
            G.push({ borderColor: '#00000000', color: '#27C04F', id: 'gp', isExpanded: true, name: 'Score' });
        }
        G.push({ borderColor: ST.best.bc, color: '#27C04F', id: 'gq', isExpanded: true, name: 'Quality' });
        G.push({ borderColor: ST.res.bc, color: '#FFBE01', id: 'gr', isExpanded: true, name: 'Resolution' });
        G.push({ borderColor: ST.res.bc, color: '#FF6B6B', id: 'gv', isExpanded: true, name: 'Visual' });
        G.push({ borderColor: '#00000000', color: '#45B7D1', id: 'ga', isExpanded: true, name: 'Audio' });
        G.push({ borderColor: '#00000000', color: '#FFD700', id: 'gc', isExpanded: true, name: 'Channels' });
        G.push({ borderColor: '#00000000', color: '#4ECDC4', id: 'gl', isExpanded: true, name: 'Language' });

        return { filters: T, groups: G };
    };

    const getFormatterConfig = () => {
        const d = presetConfig.desc === 'fn'
            ? '{stream.filename::exists["{stream.filename}"||""]}'
            : '{stream.filename::exists["{stream.filename}"||""]}\\n{service.shortName::exists["{service.shortName}"||""]}{stream.type::exists[" · {stream.type::title::replace(\'P2p\',\'P2P\')}"||""]}{stream.size::>0[" · {stream.size::bytes}"||""]}';
        if (presetConfig.qual === 'pct') {
            return {
                name: '{stream.nSeScore::exists["{stream.nSeScore}% "||""]}{stream.quality::exists["{stream.quality::title}"||""]}',
                desc: d
            };
        }
        if (presetConfig.qual === 'bgb') {
            return {
                name: "{stream.nSeScore::exists[\"{stream.nSeScore::pstar::replace('\\u2bea','\\u2605')::replace('\\u2605\\u2605\\u2605\\u2605\\u2605','\\u265b ')::replace('\\u2605\\u2605\\u2605\\u2605\\u2606','\\u2b51 ')::replace('\\u2605\\u2605\\u2605\\u2606\\u2606','\\u2726 ')::replace('\\u2605\\u2605\\u2606\\u2606\\u2606','\\u25b3 ')::replace('\\u2605\\u2606\\u2606\\u2606\\u2606','\\u2205 ')::replace('\\u2606\\u2606\\u2606\\u2606\\u2606','\\u2205 ')}\"||\"\"]}" + '{stream.quality::exists["{stream.quality::title}"||""]}',
                desc: d
            };
        }
        return {
            name: '{stream.quality::exists["{stream.quality::title}"||""]}',
            desc: d
        };
    };

    const parseARGBtoRGBA = (argbStr) => {
        if (!argbStr) return 'transparent';
        let hex = argbStr.trim().replace('#', '');
        
        if (hex.length === 8) {
            const a = parseInt(hex.substring(0, 2), 16) / 255;
            const r = parseInt(hex.substring(2, 4), 16);
            const g = parseInt(hex.substring(4, 6), 16);
            const b = parseInt(hex.substring(6, 8), 16);
            return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
        } else if (hex.length === 6) {
            return `#${hex}`;
        }
        return 'transparent';
    };

    const parseRGBtoARGB = (hexStr) => {
        if (!hexStr) return '#FFFFFFFF';
        let hex = hexStr.trim().replace('#', '').toUpperCase();
        if (hex.length === 6) {
            return `#FF${hex}`;
        }
        return `#${hex}`;
    };

    const loadConfig = () => {
        // Sync Visual Active States on Start
        document.querySelectorAll('.preset-opts').forEach(groupContainer => {
            const group = groupContainer.getAttribute('data-group');
            const defaultValue = presetConfig[group];
            
            groupContainer.querySelectorAll('.preset-opt').forEach(opt => {
                if (opt.getAttribute('data-value') === defaultValue) {
                    opt.classList.add('active');
                } else {
                    opt.classList.remove('active');
                }
            });
        });
        
        upd();
    };

    const initApp = () => {
        renderAccordion();
        updateJSONViewer();
        runLiveMatchTester();
    };

    const upd = () => {
        badgeConfig = generateBadgeConfig(presetConfig);
        
        // Show/hide Setup Guide instructions dynamically
        const needsAIOS = presetConfig.qual === 'bgb' || presetConfig.qual === 'pct';
        const guideSteps = document.querySelector('main > article:last-of-type .grid').children;
        
        if (guideSteps && guideSteps.length === 3) {
            if (needsAIOS) {
                guideSteps[0].style.display = 'block';
                guideSteps[1].style.display = 'block';
                guideSteps[2].querySelector('h5').textContent = '3. Import Filters into Nuvio';
            } else {
                guideSteps[0].style.display = 'none';
                guideSteps[1].style.display = 'none';
                guideSteps[2].querySelector('h5').textContent = '1. Import Filters into Nuvio';
            }
        }

        initApp();
    };

    const renderAccordion = () => {
        groupsContainer.innerHTML = '';
        
        if (!badgeConfig.groups || badgeConfig.groups.length === 0) {
            groupsContainer.innerHTML = '<div class="loading-state">No configuration metadata available.</div>';
            return;
        }

        badgeConfig.groups.forEach((group) => {
            const details = document.createElement('details');
            if (group.isExpanded) details.setAttribute('open', '');
            
            const summary = document.createElement('summary');
            summary.innerHTML = `
                <span class="accordion-indicator-dot" style="background-color: ${group.color || '#FFFFFF'}"></span>
                <strong>${group.name}</strong>
            `;

            details.addEventListener('toggle', () => {
                group.isExpanded = details.open;
                updateJSONViewer();
            });

            const body = document.createElement('div');
            body.style.paddingTop = '0.5rem';

            const filtersInGroup = badgeConfig.filters.filter(f => f.groupId === group.id);
            
            if (filtersInGroup.length === 0) {
                body.innerHTML = '<p class="loading-state">No filters active in this group.</p>';
            } else {
                const listContainer = document.createElement('div');
                listContainer.className = 'badge-list-container';

                filtersInGroup.forEach(filter => {
                    const item = document.createElement('div');
                    item.className = 'badge-list-item';
                    
                    const previewUrl = getScaledImageURL(filter.imageURL);

                    item.innerHTML = `
                        <input type="checkbox" class="badge-checkbox" data-id="${filter.id}" ${filter.isEnabled ? 'checked' : ''}>
                        <div class="badge-info">
                            <span class="badge-label-text">${filter.name}</span>
                            <span class="badge-pattern-text">${filter.pattern}</span>
                        </div>
                        <div class="badge-preview-cell">
                            ${previewUrl ? `<img class="badge-preview-img" src="${previewUrl}" alt="${filter.name}">` : `<span class="badge-preview-chip" style="background-color: ${parseARGBtoRGBA(filter.tagColor)}; border: 1px solid ${parseARGBtoRGBA(filter.borderColor)}; color: ${parseARGBtoRGBA(filter.textColor)}">${filter.name}</span>`}
                        </div>
                        <button class="badge-action-btn" data-id="${filter.id}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                    `;

                    item.querySelector('.badge-checkbox').addEventListener('change', (e) => {
                        filter.isEnabled = e.target.checked;
                        updateJSONViewer();
                        runLiveMatchTester();
                    });

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

            details.appendChild(summary);
            details.appendChild(body);
            groupsContainer.appendChild(details);
        });

        const activeCount = badgeConfig.filters.filter(f => f.isEnabled).length;
        badgeCountText.textContent = `${activeCount} / ${badgeConfig.filters.length} Enabled`;
    };

    const updateJSONViewer = () => {
        jsonCodeBlock.textContent = JSON.stringify(badgeConfig, null, 2);
    };

    // --- HIGH-FIDELITY MOCK STREAM PREVIEWER ---
    const runLiveMatchTester = () => {
        previewListContainer.innerHTML = '';
        const p = presetConfig.icon;
        const mono = p === 'mono';

        const fmtName = (s) => {
            const sym = { best: '♛ ', good: '⭑ ', ok: '✦ ' };
            if (presetConfig.qual === 'bgb') return (sym[s.q] || '') + s.qual;
            if (presetConfig.qual === 'pct') return s.pct + '% ' + s.qual;
            return s.qual;
        };

        const renderTag = (label, img, st, lg) => {
            const s = `border-color: ${parseARGBtoRGBA(st.bc)}; background: ${parseARGBtoRGBA(st.bg)}; color: ${parseARGBtoRGBA(st.tc)}`;
            const cls = 'n-badge-chip' + (lg ? ' lg' : '');
            if (img) {
                return `<span class="${cls}" style="${s}"><img src="${imageBaseURL + img}" alt="${label || ''}"></span>`;
            }
            return `<span class="${cls}" style="${s}">${label}</span>`;
        };

        // Render standard predefined streams
        STREAMS.forEach(s => {
            const card = document.createElement('div');
            card.className = 'sim-stream-card';
            
            const descTxt = presetConfig.desc === 'fn' 
                ? s.fn 
                : `${s.fn}\nRD · Debrid · ${s.size}`;

            let badgesHTML = '';

            // 1. QUALITY
            if (presetConfig.qual === 'bgb') {
                const qst = s.q === 'ok' ? ST.res : (mono ? ST.res : ST[s.q]);
                const img = s.q === 'ok' ? 'mono-ok-' + s.src + '.png' : p + '-' + s.q + '-' + s.src + '.png';
                badgesHTML += renderTag(null, img, qst);
            } else if (presetConfig.qual === 'tier') {
                badgesHTML += renderTag(null, p + '-icon-' + s.src + '-' + s.tier + '.png', mono ? ST.res : ST.best);
            } else if (presetConfig.qual === 'src') {
                badgesHTML += renderTag(null, p + '-' + s.src + '.png', mono ? ST.res : ST.best);
            } else {
                // Percentages HSL style
                const hsl = (h, s, l) => {
                    const a = s * Math.min(l, 1 - l);
                    const f = n => {
                        const k = (n + h / 30) % 12;
                        return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                    };
                    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
                };
                const hx = (r, g, b) => ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
                const pctS = (p) => {
                    const c = hsl((p / 100) * 120, 1, .45);
                    const h = hx(...c);
                    return { bc: '#66' + h, bg: '#33' + h, tc: '#FF' + h };
                };
                badgesHTML += renderTag(s.pct + '%', null, mono ? ST.res : pctS(s.pct));
            }

            // 1b. SeaDex
            if (s.seadex) {
                badgesHTML += renderTag(null, p + '-SeaDex.png', mono ? ST.res : ST.best);
            }

            // 2. RESOLUTION
            const ri = s.res === '4K' ? '4k.png' : s.res.toLowerCase() + '.png';
            badgesHTML += renderTag(null, ri, ST.res);

            // 3. HDR
            if (s.hdr && (presetConfig.hdr === 'always' || !s.dv)) {
                const hi = s.hdr === 'HDR10+' ? 'HDR10Plus.png' : s.hdr === 'HDR10' ? 'HDR10.png' : 'HDR.png';
                badgesHTML += renderTag(null, hi, ST.res);
            }

            // 3b. IMAX
            if (s.imax === 'IMAX Enhanced') badgesHTML += renderTag(null, 'IMAX-enhanced.png', ST.res);
            else if (s.imax === 'IMAX') badgesHTML += renderTag(null, 'IMAX.png', ST.res);

            // 4. AUDIO + DOLBY VISION
            const isDTS = s.aud && s.aud.startsWith('dts');
            if (presetConfig.dv === 'combo') {
                if (s.dv && !isDTS) {
                    if (s.aud === 'atmos') badgesHTML += renderTag(null, 'atmos-vision.png', ST.tr, true);
                    else if (s.aud === 'truehd') badgesHTML += renderTag(null, 'truehd-vision.png', ST.tr, true);
                    else if (s.aud === 'ddp') badgesHTML += renderTag(null, 'digitalplus-vision.png', ST.tr, true);
                    else if (s.aud === 'dd') badgesHTML += renderTag(null, 'digital-vision.png', ST.tr, true);
                    else badgesHTML += renderTag(null, 'vision.png', ST.tr, true);
                } else {
                    if (s.dv) badgesHTML += renderTag(null, 'vision.png', ST.tr, true);
                    if (s.aud === 'atmos') badgesHTML += renderTag(null, 'atmos.png', ST.tr, true);
                    else if (s.aud === 'truehd') badgesHTML += renderTag(null, 'truehd.png', ST.tr, true);
                    else if (s.aud === 'ddp') badgesHTML += renderTag(null, 'digitalplus.png', ST.tr, true);
                    else if (s.aud === 'dd') badgesHTML += renderTag(null, 'digital.png', ST.tr, true);
                    else if (isDTS) {
                        const di = s.aud === 'dtsx' ? 'dtsx' : s.aud === 'dtshdma' ? 'dtshdma' : s.aud === 'dtshd' ? 'dtshd' : 'dts';
                        badgesHTML += renderTag(null, di + '.png', ST.res);
                    }
                }
            } else {
                if (s.dv) badgesHTML += renderTag(null, 'vision.png', ST.tr, true);
                if (s.aud === 'atmos') badgesHTML += renderTag(null, 'atmos.png', ST.tr, true);
                else if (s.aud === 'truehd') badgesHTML += renderTag(null, 'truehd.png', ST.tr, true);
                else if (s.aud === 'ddp') badgesHTML += renderTag(null, 'digitalplus.png', ST.tr, true);
                else if (s.aud === 'dd') badgesHTML += renderTag(null, 'digital.png', ST.tr, true);
                else if (isDTS) {
                    const di = s.aud === 'dtsx' ? 'dtsx' : s.aud === 'dtshdma' ? 'dtshdma' : s.aud === 'dtshd' ? 'dtshd' : 'dts';
                    badgesHTML += renderTag(null, di + '.png', ST.res);
                }
            }

            // 5. CHANNELS
            badgesHTML += renderTag(null, s.ch === '7.1' ? '7dot1.png' : '5dot1.png', ST.tr);

            card.innerHTML = `
                <div class="sim-meta">
                    <h4 class="sim-title-text">${fmtName(s)}</h4>
                    <p class="sim-desc-text">${descTxt}</p>
                </div>
                <div class="badges-row">${badgesHTML}</div>
            `;
            previewListContainer.appendChild(card);
        });

        // Render the user's interactive custom text match stream card at the end
        const customTitleStr = testerInput.value.trim();
        if (customTitleStr) {
            const customCard = document.createElement('div');
            customCard.className = 'sim-stream-card';
            customCard.style.border = '1px dashed var(--pico-primary-border-color)';

            const parts = customTitleStr.split('|').map(s => s.trim());
            const mockName = parts[0] || 'Scraper';
            const mockTitle = parts.slice(1).join(' | ');
            const finalTitle = mockTitle ? `${mockName} | ${mockTitle}` : mockName;

            let size = '1.45 GB';
            let quality = '1080p';
            let language = 'Multi';

            if (customTitleStr.toLowerCase().includes('4k') || customTitleStr.toLowerCase().includes('2160p')) {
                quality = '4K';
                size = '12.80 GB';
            } else if (customTitleStr.toLowerCase().includes('720p')) {
                quality = '720p';
                size = '680 MB';
            }

            if (customTitleStr.toLowerCase().includes('french')) language = 'French';
            else if (customTitleStr.toLowerCase().includes('spanish')) language = 'Spanish';

            const mockDesc = `${quality} • ${size} • ${language}`;

            const customBadgesRow = document.createElement('div');
            customBadgesRow.className = 'badges-row';

            const activeFilters = badgeConfig.filters.filter(f => f.isEnabled);
            activeFilters.forEach(filter => {
                try {
                    let cleanedPattern = filter.pattern;
                    let flags = '';
                    
                    if (cleanedPattern.startsWith('(?i)')) {
                        flags += 'i';
                        cleanedPattern = cleanedPattern.substring(4);
                    }

                    const regex = new RegExp(cleanedPattern, flags);
                    const isNameMatch = regex.test(mockName);
                    const isDescMatch = regex.test(mockDesc) || regex.test(mockTitle);
                    
                    if (isNameMatch || isDescMatch) {
                        const chip = document.createElement('div');
                        chip.className = 'n-badge-chip';
                        
                        const webBgColor = parseARGBtoRGBA(filter.tagColor);
                        const webBorderColor = parseARGBtoRGBA(filter.borderColor);
                        const webTextColor = parseARGBtoRGBA(filter.textColor) || '#FFFFFF';

                        if (filter.tagStyle === 'filled') {
                            chip.style.backgroundColor = webBgColor;
                        } else if (filter.tagStyle === 'outlined') {
                            chip.style.border = `1px solid ${webBorderColor}`;
                        } else if (filter.tagStyle === 'filled and bordered') {
                            chip.style.backgroundColor = webBgColor;
                            chip.style.border = `1px solid ${webBorderColor}`;
                        }
                        
                        chip.style.color = webTextColor;

                        const finalImageURL = getScaledImageURL(filter.imageURL);

                        if (finalImageURL) {
                            chip.innerHTML = `<img src="${finalImageURL}" alt="${filter.name}">`;
                        } else {
                            chip.textContent = filter.name;
                            chip.style.fontSize = '9px';
                            chip.style.fontWeight = 'bold';
                        }
                        customBadgesRow.appendChild(chip);
                    }
                } catch (err) {
                    console.error(`Invalid matcher rule for ${filter.name}:`, err);
                }
            });

            customCard.innerHTML = `
                <div class="sim-meta">
                    <h4 class="sim-title-text" style="color: var(--pico-primary);">Interactive Simulator</h4>
                    <p class="sim-desc-text" style="margin-bottom: 0.2rem;"><b>Match:</b> ${finalTitle}</p>
                    <p class="sim-desc-text">${mockDesc}</p>
                </div>
            `;
            customCard.appendChild(customBadgesRow);
            previewListContainer.appendChild(customCard);
        }
    };

    testerInput.addEventListener('input', runLiveMatchTester);

    // --- SETUP INTEGRATION BUTTON HANDLERS ---
    const handleCopyText = (textValue) => {
        navigator.clipboard.writeText(textValue).then(() => {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = 'Copied to Clipboard!';
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => document.body.removeChild(toast), 350);
            }, 1200);
        });
    };

    document.getElementById('btn-copy-fname').addEventListener('click', () => {
        const fmt = getFormatterConfig();
        handleCopyText(fmt.name);
    });

    document.getElementById('btn-copy-fdesc').addEventListener('click', () => {
        const fmt = getFormatterConfig();
        handleCopyText(fmt.desc);
    });

    document.getElementById('btn-copy-import-url').addEventListener('click', () => {
        const importURL = 'https://raw.githubusercontent.com/dustincos/nuvio-badges/main/presets/' + presetConfig.icon + '-' + presetConfig.qual + '-' + presetConfig.dv + '-' + presetConfig.hdr + '.json';
        handleCopyText(importURL);
    });

    // --- FORM HANDLER (ADD BADGE) ---
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
            
            const formattedLabel = encodeURIComponent(shieldLabel.replace(/_/g, ' '));
            imageURL = `https://img.shields.io/badge/${formattedLabel}-${shieldColor}.png?style=flat&scale=3`;
            
            tagColor = parseRGBtoARGB(newBadgeColorText.value.trim());
            borderColor = parseRGBtoARGB(newBadgeBorderText.value.trim());
            textColor = parseRGBtoARGB(newBadgeColorText.value.trim());
        } else {
            imageURL = document.getElementById('new-badge-imageurl').value.trim();
            tagColor = '#00000000';
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

        badgeConfig.filters.push(newFilter);
        
        const groupObj = badgeConfig.groups.find(g => g.id === badgeGroup);
        if (groupObj) groupObj.isExpanded = true;

        renderAccordion();
        updateJSONViewer();
        runLiveMatchTester();

        addBadgeForm.reset();
        newBadgeColorText.value = '#00D2FF';
        newBadgeColorPicker.value = '#00D2FF';
        newBadgeBorderText.value = '#00D2FF';
        newBadgeBorderPicker.value = '#00D2FF';
        
        document.querySelector('[data-tab="tab-edit"]').click();
    });

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
            btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 2000);
        });
    });

    loadConfig();
});
