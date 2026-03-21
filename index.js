/**
 * Persona Tags — SillyTavern 第三方扩展
 * 功能：给 User 人设打标签 + 按标签搜索/筛选人设 + 按绑定关系筛选
 * 零 import，通过 SillyTavern.getContext() 访问全局 API
 */

jQuery(async () => {
    const LOG = '[persona-tags]';
    const EXT_NAME = 'personaTags';

    // ===== 等待 SillyTavern 就绪 =====
    await waitForCondition(() => typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function', 10000);
    console.log(LOG, 'SillyTavern context ready');

    // ===== 设置读写 =====
    function getSettings() {
        const ctx = SillyTavern.getContext();
        if (!ctx.extensionSettings[EXT_NAME]) {
            ctx.extensionSettings[EXT_NAME] = { tagMap: {} };
            ctx.saveSettingsDebounced();
        }
        return ctx.extensionSettings[EXT_NAME];
    }

    function saveSettings() {
        SillyTavern.getContext().saveSettingsDebounced();
    }

    // ===== 标签颜色 =====
    const TAG_COLORS = [
        { bg: '#4a90d9', fg: '#fff' },
        { bg: '#d94a7b', fg: '#fff' },
        { bg: '#2ecc71', fg: '#000' },
        { bg: '#e67e22', fg: '#fff' },
        { bg: '#9b59b6', fg: '#fff' },
        { bg: '#1abc9c', fg: '#000' },
        { bg: '#e74c3c', fg: '#fff' },
        { bg: '#3498db', fg: '#fff' },
        { bg: '#f39c12', fg: '#000' },
        { bg: '#8e44ad', fg: '#fff' },
        { bg: '#16a085', fg: '#fff' },
        { bg: '#d35400', fg: '#fff' },
        { bg: '#2980b9', fg: '#fff' },
        { bg: '#27ae60', fg: '#fff' },
        { bg: '#c0392b', fg: '#fff' },
        { bg: '#7f8c8d', fg: '#fff' },
    ];

    function hashStr(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    function getTagColor(tagName) {
        return TAG_COLORS[hashStr(tagName) % TAG_COLORS.length];
    }

    // ===== 服务器头像列表缓存（分页下 DOM 不完整，需用服务器列表作权威来源） =====
    let serverAvatarSet = null;

    async function refreshServerAvatars() {
        try {
            const ctx = SillyTavern.getContext();
            const response = await fetch('/api/avatars/get', {
                method: 'POST',
                headers: ctx.getRequestHeaders(),
            });
            if (response.ok) {
                const list = await response.json();
                if (Array.isArray(list)) {
                    serverAvatarSet = new Set(list);
                    console.log(LOG, 'Server avatar cache refreshed:', serverAvatarSet.size, 'avatars');
                }
            }
        } catch (e) {
            console.error(LOG, 'Failed to fetch avatar list:', e);
        }
    }

    // ===== 标签数据操作 =====
    function getPersonaTags(avatarId) {
        return getSettings().tagMap[avatarId] || [];
    }

    function setPersonaTags(avatarId, tags) {
        getSettings().tagMap[avatarId] = tags;
        saveSettings();
    }

    function addTagToPersona(avatarId, tagName) {
        tagName = tagName.trim();
        if (!tagName) return false;
        const tags = getPersonaTags(avatarId);
        if (tags.includes(tagName)) return false;
        tags.push(tagName);
        setPersonaTags(avatarId, tags);
        return true;
    }

    function removeTagFromPersona(avatarId, tagName) {
        const tags = getPersonaTags(avatarId).filter(t => t !== tagName);
        setPersonaTags(avatarId, tags);
    }

    /** 清理 tagMap 中已不存在的人设条目（高频调用，只动插件自身数据） */
    function purgeOrphanedEntries() {
        const settings = getSettings();
        const ctx = SillyTavern.getContext();
        const personas = ctx.powerUserSettings?.personas;
        if (!serverAvatarSet && (!personas || Object.keys(personas).length === 0)) return;

        let changed = false;
        for (const avatarId of Object.keys(settings.tagMap)) {
            // 在服务器列表中 OR 在 personas 中 → 有效（兼容新建但缓存未刷新的情况）
            // 孤儿条目（已删但 personas 未清理）由 purgeOrphanedSTEntries 先清掉 personas，
            // 之后这里自然也会清掉 tagMap
            const inServer = serverAvatarSet && serverAvatarSet.has(avatarId);
            const inPersonas = personas && (avatarId in personas);
            if (!inServer && !inPersonas) {
                console.log(LOG, 'Purging orphaned tagMap entry:', avatarId);
                delete settings.tagMap[avatarId];
                changed = true;
            }
        }
        if (changed) saveSettings();
    }

    /**
     * 清理 ST 自身的孤儿 persona 记录（仅在 refreshServerAvatars 之后调用，缓存保证是新鲜的）
     * ST 删除人设后不一定清理 personas/persona_descriptions，这里替它补上
     */
    function purgeOrphanedSTEntries() {
        if (!serverAvatarSet) return;
        const ctx = SillyTavern.getContext();
        const personas = ctx.powerUserSettings?.personas;
        if (!personas) return;

        const descriptions = ctx.powerUserSettings?.persona_descriptions;
        let changed = false;
        for (const avatarId of Object.keys(personas)) {
            if (!serverAvatarSet.has(avatarId)) {
                console.log(LOG, 'Purging orphaned ST persona entry:', avatarId);
                delete personas[avatarId];
                if (descriptions && avatarId in descriptions) {
                    delete descriptions[avatarId];
                }
                changed = true;
            }
        }
        if (changed) saveSettings();
    }

    function getAllTags() {
        purgeOrphanedEntries();
        const allTags = new Set();
        for (const tags of Object.values(getSettings().tagMap)) {
            for (const tag of tags) {
                allTags.add(tag);
            }
        }
        return [...allTags].sort();
    }

    // ===== 绑定关系查询 =====
    /**
     * 获取与当前角色卡/群组绑定的所有人设 avatarId 列表
     * @returns {string[]|null} 绑定的人设列表，null 表示当前没有角色卡
     */
    function getConnectedPersonas() {
        const ctx = SillyTavern.getContext();
        const charId = ctx.characterId;
        const groupId = ctx.groupId;

        let targetType, targetId;

        if (groupId) {
            targetType = 'group';
            targetId = groupId;
        } else if (charId !== undefined && charId !== null) {
            targetType = 'character';
            targetId = ctx.characters[charId]?.avatar;
        }

        if (!targetId) return null;

        const descriptions = ctx.powerUserSettings.persona_descriptions;
        const connected = [];
        for (const [avatarId, desc] of Object.entries(descriptions)) {
            const connections = desc?.connections ?? [];
            if (connections.some(c => c.type === targetType && c.id === targetId)) {
                connected.push(avatarId);
            }
        }
        return connected;
    }

    /**
     * 获取当前角色卡/群组的显示名称
     */
    function getCurrentTargetName() {
        const ctx = SillyTavern.getContext();
        if (ctx.groupId) {
            const group = ctx.groups.find(g => g.id === ctx.groupId);
            return group?.name || null;
        }
        if (ctx.characterId !== undefined && ctx.characterId !== null) {
            return ctx.characters[ctx.characterId]?.name || null;
        }
        return null;
    }

    // ===== 当前人设跟踪 =====
    let currentPersonaAvatar = null;

    function detectCurrentPersona() {
        const selected = $('#user_avatar_block .avatar-container.selected');
        return selected.length ? selected.attr('data-avatar-id') : null;
    }

    // ===== 标签编辑器 UI（右栏） =====
    function renderTagEditor(avatarId) {
        currentPersonaAvatar = avatarId;
        const $section = $('#persona-tags-editor-section');
        if (!$section.length) return;

        const tags = avatarId ? getPersonaTags(avatarId) : [];
        const $list = $section.find('.persona-tags-list');
        $list.empty();

        if (!avatarId) {
            $list.html('<span class="persona-tags-empty">请先选择一个人设</span>');
            $section.find('#persona-tag-input').val('').prop('disabled', true);
            return;
        }

        $section.find('#persona-tag-input').prop('disabled', false);

        if (tags.length === 0) {
            $list.html('<span class="persona-tags-empty">暂无标签，在下方输入添加</span>');
        } else {
            for (const tag of tags) {
                const color = getTagColor(tag);
                const $tag = $('<span class="persona-tag-item"></span>')
                    .css({ background: color.bg, color: color.fg })
                    .text(tag);
                const $remove = $('<span class="persona-tag-remove" title="移除标签">×</span>');
                $remove.on('click', () => {
                    removeTagFromPersona(avatarId, tag);
                    renderTagEditor(avatarId);
                    renderFilterArea();
                    applyDomFilter();
                });
                $tag.append($remove);
                $list.append($tag);
            }
        }
    }

    function injectTagEditor() {
        if ($('#persona-tags-editor-section').length) return;

        const $target = $('#persona_connections_list');
        if (!$target.length) return;

        const html = `
            <div id="persona-tags-editor-section" class="persona-tags-section">
                <div class="persona-tags-header">
                    <i class="fa-solid fa-tags"></i>
                    <span>人设标签</span>
                </div>
                <div class="persona-tags-list"></div>
                <form id="persona-tag-form" autocomplete="off">
                    <input id="persona-tag-input" class="text_pole" type="text"
                           placeholder="输入标签名，回车添加" enterkeyhint="done">
                </form>
            </div>
        `;
        $target.after(html);

        // 回车添加标签：通过 form submit 实现，兼容移动端虚拟键盘
        // （移动端 Android 的 keydown 事件 e.key 返回 "Unidentified" 而非 "Enter"，
        //   但 form submit 在所有平台都能正常触发）
        $('#persona-tag-form').on('submit', function (e) {
            e.preventDefault();
            const $input = $('#persona-tag-input');
            const raw = $input.val().trim();
            if (!raw || !currentPersonaAvatar) return;

            const parts = raw.split(/[,，]/).map(s => s.trim()).filter(Boolean);
            let added = 0;
            let duplicated = 0;
            for (const tag of parts) {
                if (addTagToPersona(currentPersonaAvatar, tag)) {
                    added++;
                } else {
                    duplicated++;
                }
            }
            if (added > 0) {
                $input.val('');
                renderTagEditor(currentPersonaAvatar);
                renderFilterArea();
                renderCardTags();
            }
            if (duplicated > 0 && added === 0) {
                toastr.warning('标签已存在');
            }
        });

        // jQuery UI Autocomplete（如果可用）
        if ($.fn.autocomplete) {
            $('#persona-tag-input').autocomplete({
                source: function (request, response) {
                    const existing = currentPersonaAvatar ? getPersonaTags(currentPersonaAvatar) : [];
                    const all = getAllTags().filter(t => !existing.includes(t));
                    const term = request.term.toLowerCase();
                    response(all.filter(t => t.toLowerCase().includes(term)));
                },
                select: function (event, ui) {
                    if (currentPersonaAvatar) {
                        addTagToPersona(currentPersonaAvatar, ui.item.value);
                        $(this).val('');
                        renderTagEditor(currentPersonaAvatar);
                        renderFilterArea();
                        renderCardTags();
                    }
                    return false;
                },
                classes: { 'ui-autocomplete': 'persona-tag-autocomplete' },
                minLength: 0,
            });
            $('#persona-tag-input').on('focus', function () {
                $(this).autocomplete('search', '');
            });
        }
    }

    // ===== 视图模式切换（绑定 / 全部） =====
    let viewMode = 'connected'; // 'connected' | 'all'

    function injectViewModeToggle() {
        if ($('#persona-tags-view-mode').length) return;

        const $searchRow = $('.persona_management_left_column .flex-container.marginBot10');
        if (!$searchRow.length) return;

        const html = `
            <div id="persona-tags-view-mode" class="persona-view-mode-bar">
                <span class="persona-view-mode-btn active" data-mode="connected" title="仅显示与当前角色卡绑定的人设">
                    <i class="fa-solid fa-link"></i> 当前角色
                </span>
                <span class="persona-view-mode-btn" data-mode="all" title="显示所有人设">
                    <i class="fa-solid fa-users"></i> 全部人设
                </span>
                <span class="persona-view-mode-info"></span>
            </div>
        `;
        $searchRow.after(html);

        // 点击切换
        $(document).on('click', '.persona-view-mode-btn', function () {
            const mode = $(this).attr('data-mode');
            viewMode = mode;
            $('.persona-view-mode-btn').removeClass('active');
            $(this).addClass('active');
            updateViewModeInfo();
            applyDomFilter();
        });

        updateViewModeInfo();
    }

    function updateViewModeInfo() {
        const $info = $('.persona-view-mode-info');
        if (!$info.length) return;

        if (viewMode === 'connected') {
            const name = getCurrentTargetName();
            const connected = getConnectedPersonas();
            if (name && connected !== null) {
                $info.text(`${name} (${connected.length})`);
            } else {
                $info.text('无角色卡');
            }
        } else {
            $info.text('');
        }
    }

    // ===== 标签筛选区（左栏，下拉框样式） =====
    let activeFilters = new Set();
    let dropdownOpen = false;

    function renderFilterArea() {
        const allTags = getAllTags();
        // 清除 activeFilters 中已不存在的 tag（防止幽灵筛选）
        for (const f of [...activeFilters]) {
            if (!allTags.includes(f)) activeFilters.delete(f);
        }
        let $area = $('#persona-tags-filter-area');

        if (allTags.length === 0) {
            $area.remove();
            return;
        }

        // 筛选区放在视图模式切换栏之后
        if (!$area.length) {
            const $viewMode = $('#persona-tags-view-mode');
            const $anchor = $viewMode.length
                ? $viewMode
                : $('.persona_management_left_column .flex-container.marginBot10');
            if (!$anchor.length) return;
            $area = $('<div id="persona-tags-filter-area" class="persona-tags-filter-area"></div>');
            $anchor.after($area);
        }

        $area.empty();

        // 顶部行：下拉按钮 + 已选标签药丸
        const $topRow = $('<div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px"></div>');

        const toggleLabel = activeFilters.size > 0
            ? `<i class="fa-solid fa-filter"></i> 标签筛选 <span class="filter-count">${activeFilters.size}</span> <i class="fa-solid fa-caret-${dropdownOpen ? 'up' : 'down'}" style="margin-left:2px"></i>`
            : `<i class="fa-solid fa-filter"></i> 标签筛选 <i class="fa-solid fa-caret-${dropdownOpen ? 'up' : 'down'}" style="margin-left:2px"></i>`;
        const $toggle = $(`<span class="persona-filter-dropdown-toggle">${toggleLabel}</span>`);
        $toggle.on('click', () => {
            dropdownOpen = !dropdownOpen;
            $area.find('.persona-filter-dropdown-panel').toggleClass('open', dropdownOpen);
            renderFilterArea();
        });
        $topRow.append($toggle);
        $area.append($topRow);

        // 下拉面板
        const $panel = $(`<div class="persona-filter-dropdown-panel ${dropdownOpen ? 'open' : ''}"></div>`);
        const $list = $('<div class="persona-filter-dropdown-list"></div>');

        // 重置按钮（常驻）
        const $clear = $('<span class="persona-tag-clear-btn"><i class="fa-solid fa-xmark"></i> 重置</span>');
        $clear.on('click', () => {
            activeFilters.clear();
            renderFilterArea();
            applyDomFilter();
        });
        $list.append($clear);

        for (const tag of allTags) {
            const color = getTagColor(tag);
            const isActive = activeFilters.has(tag);
            const $btn = $('<span class="persona-tag-filter-btn"></span>')
                .toggleClass('active', isActive)
                .css({ background: color.bg, color: color.fg })
                .attr('data-tag', tag)
                .text(tag);
            $btn.on('click', () => {
                if (activeFilters.has(tag)) {
                    activeFilters.delete(tag);
                } else {
                    activeFilters.add(tag);
                }
                renderFilterArea();
                applyDomFilter();
            });
            $list.append($btn);
        }

        $panel.append($list);
        $area.append($panel);
    }

    // ===== 在人设卡片上显示标签 =====
    function renderCardTags() {
        $('#user_avatar_block .avatar-container').each(function () {
            const avatarId = $(this).attr('data-avatar-id');
            if (!avatarId) return;

            $(this).find('.persona-card-tags').remove();

            const tags = getPersonaTags(avatarId);
            if (tags.length === 0) return;

            const $container = $('<span class="persona-card-tags"></span>');
            for (const tag of tags) {
                const color = getTagColor(tag);
                const $tag = $('<span class="persona-card-tag"></span>')
                    .css({ background: color.bg, color: color.fg })
                    .text(tag);
                $container.append($tag);
            }
            $(this).find('.ch_description').after($container);
        });
    }

    // ===== DOM 筛选（隐藏/显示人设卡片） =====
    function applyDomFilter() {
        const connectedPersonas = (viewMode === 'connected') ? getConnectedPersonas() : null;

        $('#user_avatar_block .avatar-container').each(function () {
            const avatarId = $(this).attr('data-avatar-id');
            if (!avatarId) return;

            let visible = true;

            // 第一层：绑定关系筛选
            if (connectedPersonas !== null) {
                visible = connectedPersonas.includes(avatarId);
            }

            // 第二层：标签筛选（AND 逻辑）
            if (visible && activeFilters.size > 0) {
                const tags = getPersonaTags(avatarId);
                visible = [...activeFilters].every(f => tags.includes(f));
            }

            $(this).toggleClass('persona-tag-hidden', !visible);
        });

        renderCardTags();
    }

    // ===== 工具函数 =====
    function waitForCondition(condFn, timeout = 10000) {
        return new Promise((resolve, reject) => {
            if (condFn()) return resolve();
            const start = Date.now();
            const interval = setInterval(() => {
                if (condFn()) {
                    clearInterval(interval);
                    resolve();
                } else if (Date.now() - start > timeout) {
                    clearInterval(interval);
                    reject(new Error('waitForCondition timeout'));
                }
            }, 100);
        });
    }

    // ===== 人设选择弹窗增强 =====
    function enhancePersonaPopup(personaList) {
        if (!personaList || personaList.classList.contains('persona-popup-enhanced')) return;
        personaList.classList.add('persona-popup-enhanced');

        const ctx = SillyTavern.getContext();
        const personas = ctx.powerUserSettings.personas;

        personaList.querySelectorAll('.avatar[data-type="persona"]').forEach(avatarEl => {
            const pid = avatarEl.dataset.pid;
            if (!pid) return;

            const name = personas[pid] || '[未命名]';
            const tags = getPersonaTags(pid);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'persona-popup-info';

            const nameSpan = document.createElement('div');
            nameSpan.className = 'persona-popup-name';
            nameSpan.textContent = name;
            infoDiv.appendChild(nameSpan);

            if (tags.length > 0) {
                const tagsDiv = document.createElement('div');
                tagsDiv.className = 'persona-popup-tags';
                for (const tag of tags) {
                    const color = getTagColor(tag);
                    const pill = document.createElement('span');
                    pill.className = 'persona-popup-tag';
                    pill.style.background = color.bg;
                    pill.style.color = color.fg;
                    pill.textContent = tag;
                    tagsDiv.appendChild(pill);
                }
                infoDiv.appendChild(tagsDiv);
            }

            avatarEl.appendChild(infoDiv);
        });

        // 弹窗文字汉化
        const dialog = personaList.closest('dialog');
        if (dialog) {
            dialog.querySelectorAll('h3').forEach(h => {
                if (h.textContent.trim() === 'Select Persona') h.textContent = '选择人设';
            });
            dialog.querySelectorAll('.multiline').forEach(el => {
                const t = el.textContent.trim();
                if (t.includes('Multiple personas are connected')) {
                    el.textContent = '当前角色卡绑定了多个人设，请选择一个用于本次聊天。';
                }
            });
            dialog.querySelectorAll('[data-result]').forEach(btn => {
                if (btn.textContent.trim() === 'Remove All Connections') btn.textContent = '移除所有绑定';
            });
        }
    }

    function startPopupObserver() {
        new MutationObserver(() => {
            // 每次 DOM 变化时检查是否有未增强的 .persona-list
            document.querySelectorAll('.persona-list:not(.persona-popup-enhanced)').forEach(el => {
                if (el.querySelector('.avatar[data-type="persona"]')) {
                    enhancePersonaPopup(el);
                }
            });
        }).observe(document.body, { childList: true, subtree: true });
    }

    // ===== 初始化 =====
    async function init() {
        console.log(LOG, 'Initializing...');

        getSettings();
        await refreshServerAvatars();
        purgeOrphanedSTEntries();
        injectTagEditor();
        injectViewModeToggle();
        renderFilterArea();
        startPopupObserver();

        const cur = detectCurrentPersona();
        if (cur) renderTagEditor(cur);

        // 如果当前没有角色卡，默认切到"全部"模式
        if (getConnectedPersonas() === null) {
            viewMode = 'all';
            $('.persona-view-mode-btn').removeClass('active');
            $('.persona-view-mode-btn[data-mode="all"]').addClass('active');
            updateViewModeInfo();
        }

        // 监听人设选择点击
        $(document).on('click', '#user_avatar_block .avatar-container', function () {
            const avatarId = $(this).attr('data-avatar-id');
            setTimeout(() => renderTagEditor(avatarId), 100);
        });

        // MutationObserver：人设列表重新渲染时重新应用
        let mutationDebounceTimer = null;
        const block = document.getElementById('user_avatar_block');
        if (block) {
            new MutationObserver(() => {
                renderCardTags();
                applyDomFilter();
                // 防抖刷新筛选区（DOM 重新渲染会触发多次 mutation）
                if (mutationDebounceTimer) clearTimeout(mutationDebounceTimer);
                mutationDebounceTimer = setTimeout(() => {
                    renderFilterArea();
                }, 200);
            }).observe(block, { childList: true });
        }

        // 监听人设删除按钮：ST 删除后主动刷新缓存 + 清理
        let deleteCleanupTimer = null;
        $(document).on('click', '#persona_delete_button', () => {
            // ST 会先弹确认框，确认后异步删除 + 重新渲染
            // 延迟足够久以确保 ST 的删除流程完成（服务器删文件 + 重新渲染列表）
            if (deleteCleanupTimer) clearTimeout(deleteCleanupTimer);
            deleteCleanupTimer = setTimeout(async () => {
                await refreshServerAvatars();
                purgeOrphanedSTEntries();
                // ST 连续删除时可能不重新渲染 DOM，手动移除已删除的卡片
                if (serverAvatarSet) {
                    $('#user_avatar_block .avatar-container').each(function () {
                        const avatarId = $(this).attr('data-avatar-id');
                        if (avatarId && !serverAvatarSet.has(avatarId)) {
                            $(this).remove();
                        }
                    });
                }
                renderFilterArea();
                applyDomFilter();
                const cur = detectCurrentPersona();
                renderTagEditor(cur);
                console.log(LOG, 'Post-delete cleanup done');
            }, 2000);
        });

        // 抽屉打开时重新注入
        $(document).on('click', '#persona-management-button .drawer-toggle', () => {
            setTimeout(async () => {
                await refreshServerAvatars();
                purgeOrphanedSTEntries();
                if (!$('#persona-tags-editor-section').length) {
                    injectTagEditor();
                }
                if (!$('#persona-tags-view-mode').length) {
                    injectViewModeToggle();
                }
                renderFilterArea();
                updateViewModeInfo();
                const cur = detectCurrentPersona();
                if (cur) renderTagEditor(cur);
                applyDomFilter();
            }, 300);
        });

        console.log(LOG, 'Initialized!');
    }

    await init();
});
