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

    // ===== 多语言（i18n，严格跟随 SillyTavern 当前语言，未覆盖语言统一回退英文） =====
    const SUPPORTED_LOCALES = new Set([
        'ar-sa', 'zh-cn', 'zh-tw', 'nl-nl', 'de-de', 'fr-fr',
        'is-is', 'it-it', 'ja-jp', 'ko-kr', 'pt-pt', 'ru-ru',
        'es-es', 'uk-ua', 'vi-vn', 'th-th',
    ]);

    const EN_STRINGS = {
        alreadyAtPosition: 'Already at this position',
        movedToPosition: 'Moved to #{pos}',
        currentPosition: '#{pos} of {total}',
        selectPersonaFirst: 'Please select a persona first',
        noTagsYetHint: 'No tags yet. Type below to add.',
        removeTagTitle: 'Remove tag',
        noExistingTags: 'No existing tags yet',
        allExistingTagsAdded: 'All existing tags are already added',
        sortOrderHeading: 'Sort Order',
        moveToPositionLabel: 'Move to #',
        moveToPositionSuffix: '',
        moveButton: 'Move',
        personaTagsHeading: 'Persona Tags',
        existingTagsToggleTitle: 'Show/hide existing tags',
        existingTagsToggle: 'Existing Tags',
        tagInputPlaceholder: 'Add tags, comma-separated',
        invalidPositionWarning: 'Please enter a valid position number',
        tagAlreadyExists: 'Tag already exists',
        viewConnectedTitle: 'Show only personas connected to the current character',
        viewConnected: 'Connected',
        viewAllTitle: 'Show all personas',
        viewAll: 'All',
        batchModeTitle: 'Batch edit',
        batchMode: 'Batch',
        refreshListTitle: 'Refresh persona list',
        noPersonas: 'No personas',
        refreshed: 'Refreshed',
        refreshFailed: 'Refresh failed, please check your connection',
        scrollUpTitle: 'Jump up {step} (hold 0.5s for top)',
        scrollDownTitle: 'Jump down {step} (hold 0.5s for bottom)',
        scrollStepTitle: 'Personas per quick scroll jump',
        noCharacterSelected: 'No character',
        tagFilter: 'Tag Filter',
        resetFilter: 'Reset',
        filterModeInclude: 'Inc',
        filterModeExclude: 'Exc',
        filterModeIncludeTitle: 'Mode: Include (show only matching tags)',
        filterModeExcludeTitle: 'Mode: Exclude (hide matching tags)',
        batchSelectedCount: 'Selected: {count}',
        selectAll: 'Select All',
        deselectAll: 'Clear',
        batchAddTagsBtn: 'Add Tags',
        batchRemoveTagsBtn: 'Remove Tags',
        batchDeleteBtn: 'Delete',
        batchAddTagsTitle: 'Batch Add Tags',
        batchAddTagsMsg: 'Add tags to {count} persona(s) (comma-separated):',
        batchAddTagsError: 'Failed to batch add tags',
        batchTagsAdded: 'Added {count} tag(s)',
        allTagsAlreadyExist: 'All tags already exist',
        selectedPersonasNoTags: 'Selected personas have no tags',
        batchRemoveTagsTitle: 'Batch Remove Tags',
        batchRemoveTagsMsg: 'Remove tags from {count} persona(s):',
        batchRemoveTagsError: 'Failed to batch remove tags',
        batchTagsRemoved: 'Removed {count} tag(s)',
        batchDeleteTitle: 'Batch Delete',
        batchDeleteMsg: 'Are you sure you want to delete {count} persona(s)? This cannot be undone!',
        batchDeleted: 'Deleted {count} persona(s)',
        batchDeleteFailed: 'Failed to delete {count}: {names}',
        listSeparator: ', ',
        tagExamplesPlaceholder: 'tag1, tag2, ...',
        cancelBtn: 'Cancel',
        confirmBtn: 'Confirm',
        removeSelectedBtn: 'Remove Selected',
        confirmDeleteBtn: 'Delete',
        unnamedPersona: '[Unnamed Persona]',
        unnamedShort: '[Unnamed]',
        noMatchingPersonas: 'No matching personas',
        backupExported: 'Persona backup exported (including tags and sort order)',
        backupTagsRestored: 'Restored tags for {count} persona(s)',
        backupNoPluginData: 'No tag data in backup; restored base personas only',
        dupeCopyTags: 'Copy tags',
        dupeCopyConnections: 'Copy connections',
        dupeConfirmBtn: 'Duplicate',
        createTagsLabel: 'Persona tags (optional, comma-separated)',
    };

    let currentLocale = 'en';
    let localeStrings = EN_STRINGS;

    function detectSTLocale() {
        try {
            const ctx = SillyTavern.getContext();
            if (typeof ctx.getCurrentLocale === 'function') {
                const loc = ctx.getCurrentLocale();
                if (loc) return String(loc).toLowerCase();
            }
        } catch (e) { /* fallback to ST i18n.js formula */ }
        return String(localStorage.getItem('language') || navigator.language || navigator.userLanguage || 'en').toLowerCase();
    }

    async function loadLocale() {
        const rawLocale = detectSTLocale();
        if (!SUPPORTED_LOCALES.has(rawLocale)) {
            currentLocale = 'en';
            localeStrings = EN_STRINGS;
            return;
        }
        currentLocale = rawLocale;
        try {
            const url = new URL(`./locales/${rawLocale}.json`, import.meta.url);
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            if (data && typeof data === 'object' && !Array.isArray(data)) {
                localeStrings = { ...EN_STRINGS, ...data };
                console.log(LOG, 'Loaded locale:', rawLocale);
                return;
            }
        } catch (e) {
            console.warn(LOG, `Failed to load locale ${rawLocale}, falling back to en:`, e);
        }
        currentLocale = 'en';
        localeStrings = EN_STRINGS;
    }

    function isZhCn() {
        return currentLocale === 'zh-cn';
    }

    function pt(key, params) {
        const raw = Object.prototype.hasOwnProperty.call(localeStrings, key) ? localeStrings[key] : undefined;
        let str = (typeof raw === 'string' && (raw !== '' || key === 'moveToPositionSuffix'))
            ? raw
            : (EN_STRINGS[key] ?? key);
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                str = str.replaceAll(`{${k}}`, String(v));
            }
        }
        return str;
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

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
    let serverAvatarList = [];

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
                    serverAvatarList = list;
                    serverAvatarSet = new Set(list);
                    console.log(LOG, 'Server avatar cache refreshed:', serverAvatarSet.size, 'avatars');
                    return true;
                }
            }
        } catch (e) {
            console.error(LOG, 'Failed to fetch avatar list:', e);
        }
        return false;
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
        const allTags = new Set();
        for (const tags of Object.values(getSettings().tagMap)) {
            for (const tag of tags) {
                allTags.add(tag);
            }
        }
        // 按自定义排序返回，同时清理已不存在的标签
        const settings = getSettings();
        const order = settings.tagOrder || [];
        const result = [];
        const cleanedOrder = [];
        for (const t of order) {
            if (allTags.has(t)) {
                result.push(t);
                cleanedOrder.push(t);
                allTags.delete(t);
            }
        }
        // 新标签追加到末尾
        for (const t of [...allTags].sort()) {
            result.push(t);
            cleanedOrder.push(t);
        }
        // 如果 order 有变化（删除了旧标签或追加了新标签），同步保存
        if (cleanedOrder.length !== order.length || cleanedOrder.some((t, i) => t !== order[i])) {
            settings.tagOrder = cleanedOrder;
            saveSettings();
        }
        return result;
    }

    function saveTagOrder(orderedTags) {
        getSettings().tagOrder = orderedTags;
        saveSettings();
    }

    function getOrderKey() {
        if (viewMode === 'all') return '_all';
        const ctx = SillyTavern.getContext();
        if (ctx.groupId) return 'group:' + ctx.groupId;
        if (ctx.characterId != null) {
            const avatar = ctx.characters?.[ctx.characterId]?.avatar;
            if (avatar) return 'char:' + avatar;
        }
        return '_all';
    }

    function ensurePersonaOrderObj() {
        const settings = getSettings();
        // 兼容旧版：扁平数组迁移为对象
        if (Array.isArray(settings.personaOrder)) {
            settings.personaOrder = { _all: settings.personaOrder };
            saveSettings();
        }
        if (!settings.personaOrder || typeof settings.personaOrder !== 'object') {
            settings.personaOrder = {};
        }
        return settings.personaOrder;
    }

    function getPersonaOrder() {
        const obj = ensurePersonaOrderObj();
        return obj[getOrderKey()] || [];
    }

    function savePersonaOrder(orderedIds) {
        const obj = ensurePersonaOrderObj();
        obj[getOrderKey()] = orderedIds;
        saveSettings();
    }

    function movePersonaToPosition(avatarId, targetIndex) {
        const contextList = getContextList();
        const currentIndex = contextList.indexOf(avatarId);
        if (currentIndex === -1) return;
        targetIndex = Math.max(0, Math.min(targetIndex, contextList.length - 1));
        if (currentIndex === targetIndex) { toastr.info(pt('alreadyAtPosition')); return; }

        const newVisible = [...contextList];
        newVisible.splice(currentIndex, 1);
        newVisible.splice(targetIndex, 0, avatarId);

        // 合并回完整排序（保留不在当前视图中的项）
        const obj = ensurePersonaOrderObj();
        const key = getOrderKey();
        const fullOrder = obj[key] || [];
        const visibleSet = new Set(contextList);
        const merged = [];
        let vi = 0;
        for (const id of fullOrder) {
            if (visibleSet.has(id)) merged.push(newVisible[vi++]);
            else merged.push(id);
        }
        for (; vi < newVisible.length; vi++) merged.push(newVisible[vi]);
        obj[key] = merged;
        saveSettings();

        applyFiltersAndRender();
        renderTagEditor(avatarId);
        toastr.success(pt('movedToPosition', { pos: targetIndex + 1 }));
    }

    function purgeOrphanedOrders() {
        const obj = ensurePersonaOrderObj();
        const ctx = SillyTavern.getContext();
        const hasChars = Array.isArray(ctx.characters) && ctx.characters.length > 0;
        const hasGroups = Array.isArray(ctx.groups) && ctx.groups.length > 0;
        let changed = false;
        for (const key of Object.keys(obj)) {
            if (key === '_all') continue;
            let valid = true;
            if (key.startsWith('char:')) {
                // 启动阶段 characters 尚未加载完时跳过清理，避免误删单角色排序
                if (!hasChars) continue;
                const charAvatar = key.slice(5);
                valid = ctx.characters.some(c => c?.avatar === charAvatar);
            } else if (key.startsWith('group:')) {
                if (!hasGroups) continue;
                const groupId = key.slice(6);
                valid = ctx.groups.some(g => g?.id === groupId);
            }
            if (!valid) {
                console.log(LOG, 'Purging orphaned persona order:', key);
                delete obj[key];
                changed = true;
            }
        }
        // 清理排序数组内的已删人设 ID
        if (serverAvatarSet) {
            for (const [key, arr] of Object.entries(obj)) {
                if (!Array.isArray(arr)) continue;
                const cleaned = arr.filter(id => serverAvatarSet.has(id));
                if (cleaned.length !== arr.length) {
                    obj[key] = cleaned;
                    changed = true;
                }
            }
        }
        if (changed) saveSettings();
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
        if (!descriptions) return [];
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
    let existingTagsOpen = false;
    let lastPickerAvatar = null;

    function detectCurrentPersona() {
        const selected = $('#user_avatar_block .avatar-container.selected');
        return selected.length ? selected.attr('data-avatar-id') : null;
    }

    // ===== 标签编辑器 UI（右栏） =====
    function renderTagEditor(avatarId) {
        currentPersonaAvatar = avatarId;

        // 更新位置编辑器
        const $posEditor = $('#persona-position-editor');
        if ($posEditor.length) {
            if (avatarId) {
                const contextList = getContextList();
                const pos = contextList.indexOf(avatarId);
                $('#persona-position-current').text(pos >= 0 ? pt('currentPosition', { pos: pos + 1, total: contextList.length }) : '');
                $('#persona-position-input').val('').prop('disabled', false).attr('max', contextList.length);
                $('#persona-position-go').removeClass('persona-batch-btn-disabled');
            } else {
                $('#persona-position-current').text('');
                $('#persona-position-input').val('').prop('disabled', true);
                $('#persona-position-go').addClass('persona-batch-btn-disabled');
            }
        }

        const $section = $('#persona-tags-editor-section');
        if (!$section.length) return;

        const tags = avatarId ? getPersonaTags(avatarId) : [];
        const $list = $section.find('.persona-tags-list');
        $list.empty();

        if (!avatarId) {
            $list.append($('<span class="persona-tags-empty"></span>').text(pt('selectPersonaFirst')));
            $section.find('#persona-tag-input').val('').prop('disabled', true);
            renderExistingTagsPicker(null);
            return;
        }

        $section.find('#persona-tag-input').prop('disabled', false);

        if (tags.length === 0) {
            $list.append($('<span class="persona-tags-empty"></span>').text(pt('noTagsYetHint')));
        } else {
            for (const tag of tags) {
                const color = getTagColor(tag);
                const $tag = $('<span class="persona-tag-item"></span>')
                    .css({ background: color.bg, color: color.fg })
                    .text(tag);
                const $remove = $('<span class="persona-tag-remove">×</span>').attr('title', pt('removeTagTitle'));
                $remove.on('click', () => {
                    removeTagFromPersona(avatarId, tag);
                    renderTagEditor(avatarId);
                    renderFilterArea();
                    applyFiltersAndRender();
                });
                $tag.append($remove);
                $list.append($tag);
            }
        }

        renderExistingTagsPicker(avatarId);
    }

    function renderExistingTagsPicker(avatarId) {
        const $toggle = $('#persona-existing-tags-toggle');
        const $panel = $('#persona-existing-tags-panel');
        if (!$toggle.length || !$panel.length) return;

        const isOpen = Boolean(avatarId && existingTagsOpen);
        $toggle.toggleClass('disabled', !avatarId).toggleClass('open', isOpen);
        $toggle.find('.persona-existing-tags-caret')
            .toggleClass('fa-caret-up', isOpen)
            .toggleClass('fa-caret-down', !isOpen);
        $panel.toggleClass('open', isOpen);

        if (!isOpen) {
            lastPickerAvatar = avatarId;
            return;
        }

        const prevScrollTop = (lastPickerAvatar === avatarId) ? $panel[0].scrollTop : 0;
        lastPickerAvatar = avatarId;

        const allTags = getAllTags();
        const currentTagSet = new Set(getPersonaTags(avatarId));
        const availableTags = allTags.filter(t => !currentTagSet.has(t));

        $panel.empty();

        if (allTags.length === 0) {
            $panel.append($('<span class="persona-tags-empty"></span>').text(pt('noExistingTags')));
        } else if (availableTags.length === 0) {
            $panel.append($('<span class="persona-tags-empty"></span>').text(pt('allExistingTagsAdded')));
        } else {
            const $list = $('<div class="persona-existing-tags-list"></div>');
            for (const tag of availableTags) {
                const color = getTagColor(tag);
                const $btn = $('<span class="persona-existing-tag-btn"></span>')
                    .css({ background: color.bg, color: color.fg })
                    .text(tag);
                $btn.on('click', () => {
                    if (!currentPersonaAvatar) return;
                    if (addTagToPersona(currentPersonaAvatar, tag)) {
                        renderTagEditor(currentPersonaAvatar);
                        renderFilterArea();
                        applyFiltersAndRender();
                    }
                });
                $list.append($btn);
            }
            $panel.append($list);
        }

        $panel[0].scrollTop = prevScrollTop;
    }

    function injectTagEditor() {
        if ($('#persona-tags-editor-section').length) return;

        const $target = $('#persona_connections_list');
        if (!$target.length) return;

        const moveSuffix = pt('moveToPositionSuffix');
        const moveSuffixHtml = moveSuffix ? `<span class="persona-position-label">${escapeHtml(moveSuffix)}</span>` : '';

        const html = `
            <div id="persona-position-editor" class="persona-tags-section">
                <div class="persona-tags-header">
                    <i class="fa-solid fa-arrow-up-1-9"></i>
                    <span>${escapeHtml(pt('sortOrderHeading'))}</span>
                    <span id="persona-position-current"></span>
                </div>
                <form id="persona-position-form" class="persona-position-controls" autocomplete="off">
                    <span class="persona-position-label">${escapeHtml(pt('moveToPositionLabel'))}</span>
                    <input id="persona-position-input" class="text_pole persona-position-input" type="number" min="1" enterkeyhint="done">
                    ${moveSuffixHtml}
                    <span id="persona-position-go" class="persona-batch-btn">${escapeHtml(pt('moveButton'))}</span>
                </form>
            </div>
            <div id="persona-tags-editor-section" class="persona-tags-section">
                <div class="persona-tags-header">
                    <i class="fa-solid fa-tags"></i>
                    <span>${escapeHtml(pt('personaTagsHeading'))}</span>
                    <span id="persona-existing-tags-toggle" class="persona-existing-tags-toggle disabled" title="${escapeHtml(pt('existingTagsToggleTitle'))}">
                        <i class="fa-solid fa-plus"></i> ${escapeHtml(pt('existingTagsToggle'))} <i class="fa-solid fa-caret-down persona-existing-tags-caret"></i>
                    </span>
                </div>
                <div id="persona-existing-tags-panel" class="persona-existing-tags-panel"></div>
                <div class="persona-tags-list"></div>
                <form id="persona-tag-form" autocomplete="off">
                    <input id="persona-tag-input" class="text_pole" type="text"
                           placeholder="${escapeHtml(pt('tagInputPlaceholder'))}" enterkeyhint="done">
                </form>
            </div>
        `;
        $target.after(html);

        // 已有标签快速选择展开/收起
        $('#persona-existing-tags-toggle').on('click', () => {
            if (!currentPersonaAvatar) return;
            existingTagsOpen = !existingTagsOpen;
            renderExistingTagsPicker(currentPersonaAvatar);
        });

        // 位置编辑器：form submit 收起键盘（兼容安卓），按钮触发移动
        $('#persona-position-form').on('submit', (e) => {
            e.preventDefault();
            $('#persona-position-input').blur();
        });
        $('#persona-position-go').on('click', () => {
            if (!currentPersonaAvatar) return;
            const input = parseInt($('#persona-position-input').val(), 10);
            if (isNaN(input) || input < 1) { toastr.warning(pt('invalidPositionWarning')); return; }
            movePersonaToPosition(currentPersonaAvatar, input - 1);
            $('#persona-position-input').val('');
        });

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
                applyFiltersAndRender();
            }
            if (duplicated > 0 && added === 0) {
                toastr.warning(pt('tagAlreadyExists'));
            }
        });

    }

    // ===== 视图模式切换（绑定 / 全部） =====
    let viewMode = 'connected'; // 'connected' | 'all'

    function injectViewModeToggle() {
        if ($('#persona-tags-view-mode').length) return;

        const $searchRow = $('.persona_management_left_column .flex-container.marginBot10');
        if (!$searchRow.length) return;

        const html = `
            <div id="persona-tags-view-mode" class="persona-view-mode-bar">
                <span class="persona-view-mode-btn active" data-mode="connected" title="${escapeHtml(pt('viewConnectedTitle'))}">
                    <i class="fa-solid fa-link"></i> ${escapeHtml(pt('viewConnected'))}
                </span>
                <span class="persona-view-mode-btn" data-mode="all" title="${escapeHtml(pt('viewAllTitle'))}">
                    <i class="fa-solid fa-users"></i> ${escapeHtml(pt('viewAll'))}
                </span>
                <span class="persona-view-mode-info"></span>
                <span class="persona-view-mode-btn persona-batch-mode-btn" title="${escapeHtml(pt('batchModeTitle'))}">
                    <i class="fa-solid fa-list-check"></i> ${escapeHtml(pt('batchMode'))}
                </span>
                <span class="persona-view-mode-btn persona-refresh-btn" title="${escapeHtml(pt('refreshListTitle'))}">
                    <i class="fa-solid fa-rotate"></i>
                </span>
            </div>
        `;
        $searchRow.after(html);

        // 点击切换视图模式（命名空间防止重复绑定）
        $(document).off('click.ptViewMode').on('click.ptViewMode', '.persona-view-mode-btn[data-mode]', function () {
            const mode = $(this).attr('data-mode');
            viewMode = mode;
            $('.persona-view-mode-btn[data-mode]').removeClass('active');
            $(this).addClass('active');
            updateViewModeInfo();
            applyFiltersAndRender();
        });

        // 刷新按钮
        $(document).off('click.ptRefresh').on('click.ptRefresh', '.persona-refresh-btn', async function () {
            const $icon = $(this).find('i');
            $icon.addClass('fa-spin');
            const ok = await refreshServerAvatars();
            purgeOrphanedSTEntries();
            purgeOrphanedEntries();
            if (serverAvatarList.length === 0) {
                isOwnRender = true;
                $('#user_avatar_block').empty().append($('<div class="persona-empty-placeholder"></div>').text(pt('noPersonas')));
                setTimeout(() => { isOwnRender = false; }, 0);
                $('#persona-batch-toolbar').remove();
            } else {
                applyFiltersAndRender();
            }
            renderFilterArea();
            updateViewModeInfo();
            if (currentPersonaAvatar) renderTagEditor(currentPersonaAvatar);
            $icon.removeClass('fa-spin');
            if (ok) toastr.success(pt('refreshed'));
            else toastr.error(pt('refreshFailed'));
        });

        // 批量编辑模式切换
        $(document).off('click.ptBatchMode').on('click.ptBatchMode', '.persona-batch-mode-btn', function () {
            batchMode = !batchMode;
            $(this).toggleClass('active', batchMode);
            if (!batchMode) {
                selectedAvatars.clear();
                $('#persona-batch-toolbar').remove();
            }
            applyFiltersAndRender();
            if (batchMode) renderBatchToolbar();
        });

        updateViewModeInfo();
    }

    // ===== 快捷楼层滚动（左栏顶部：[↑] [↓] [步长]） =====
    const DEFAULT_SCROLL_STEP = 10;

    function getScrollStep() {
        const raw = Number(getSettings().scrollStep);
        if (Number.isInteger(raw) && raw >= 1 && raw <= 999) return raw;
        return DEFAULT_SCROLL_STEP;
    }

    function updateQuickScrollTooltips(step) {
        $('#persona-scroll-up').attr('title', pt('scrollUpTitle', { step }));
        $('#persona-scroll-down').attr('title', pt('scrollDownTitle', { step }));
    }

    function setScrollStep(step) {
        const num = Math.max(1, Math.min(999, Math.floor(Number(step) || DEFAULT_SCROLL_STEP)));
        getSettings().scrollStep = num;
        saveSettings();
        updateQuickScrollTooltips(num);
        return num;
    }

    function quickScrollPersonas(direction) {
        const block = document.getElementById('user_avatar_block');
        if (!block) return;
        const cards = [...block.querySelectorAll('.avatar-container')];
        if (cards.length === 0) return;

        const blockRect = block.getBoundingClientRect();
        const blockStyle = getComputedStyle(block);
        const contentTop = blockRect.top
            + (parseFloat(blockStyle.borderTopWidth) || 0)
            + (parseFloat(blockStyle.paddingTop) || 0);
        const tolerance = 4;
        let currentIndex = cards.length - 1;
        for (let i = 0; i < cards.length; i++) {
            if (cards[i].getBoundingClientRect().top - contentTop >= -tolerance) {
                currentIndex = i;
                break;
            }
        }

        const step = getScrollStep();
        const targetIndex = direction > 0
            ? Math.min(cards.length - 1, currentIndex + step)
            : Math.max(0, currentIndex - step);
        const targetCard = cards[targetIndex];
        if (!targetCard) return;

        let delta = targetCard.getBoundingClientRect().top - contentTop;
        if (direction < 0 && targetIndex === 0 && delta >= -tolerance) {
            block.scrollTop = 0;
            return;
        }
        if (Math.abs(delta) <= tolerance) {
            // 网格视图下目标与当前在同一行时，至少移动到相邻行
            if (direction > 0) {
                for (let i = targetIndex + 1; i < cards.length; i++) {
                    const d = cards[i].getBoundingClientRect().top - contentTop;
                    if (d > tolerance) { delta = d; break; }
                }
            } else {
                for (let i = targetIndex - 1; i >= 0; i--) {
                    const d = cards[i].getBoundingClientRect().top - contentTop;
                    if (d < -tolerance) { delta = d; break; }
                }
            }
        }
        // 防止边界处反向滚动
        if ((direction > 0 && delta <= 0) || (direction < 0 && delta >= 0)) return;
        block.scrollTop += delta;
    }

    function quickScrollToEdge(direction) {
        const block = document.getElementById('user_avatar_block');
        if (!block) return;
        block.scrollTop = direction > 0 ? block.scrollHeight : 0;
    }

    function bindQuickScrollButton($btn, direction) {
        let pressTimer = null;
        let longPressed = false;
        let startX = 0;
        let startY = 0;
        let activePointerId = null;

        const cleanup = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
            activePointerId = null;
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
            document.removeEventListener('pointercancel', onCancel);
        };

        const onMove = (ev) => {
            if (ev.pointerId !== activePointerId) return;
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            if (dx * dx + dy * dy > 144) {
                cleanup();
            }
        };

        const onUp = (ev) => {
            if (ev.pointerId !== activePointerId) return;
            const didLongPress = longPressed;
            cleanup();
            if (!didLongPress) {
                quickScrollPersonas(direction);
            }
        };

        const onCancel = (ev) => {
            if (ev.pointerId !== activePointerId) return;
            cleanup();
        };

        $btn.on('contextmenu', (e) => e.preventDefault());
        $btn.on('pointerdown', (e) => {
            if (e.button && e.button !== 0) return;
            cleanup();
            longPressed = false;
            activePointerId = e.pointerId;
            startX = e.clientX;
            startY = e.clientY;
            pressTimer = setTimeout(() => {
                longPressed = true;
                pressTimer = null;
                quickScrollToEdge(direction);
            }, 500);
            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup', onUp);
            document.addEventListener('pointercancel', onCancel);
        });
    }

    function injectQuickScrollControls() {
        if ($('#persona-quick-scroll').length) return;

        const $anchor = $('#persona_pagination_container');
        const $gridToggle = $('#persona_grid_toggle');
        if (!$anchor.length && !$gridToggle.length) return;

        const $wrap = $(`
            <div id="persona-quick-scroll" class="persona-quick-scroll">
                <span id="persona-scroll-up" class="menu_button persona-scroll-btn">
                    <i class="fa-solid fa-arrow-up"></i>
                </span>
                <span id="persona-scroll-down" class="menu_button persona-scroll-btn">
                    <i class="fa-solid fa-arrow-down"></i>
                </span>
                <form id="persona-scroll-step-form" class="persona-scroll-step-form" autocomplete="off" novalidate>
                    <input id="persona-scroll-step" class="text_pole persona-scroll-step" type="number" min="1" max="999" inputmode="numeric" enterkeyhint="done" title="${escapeHtml(pt('scrollStepTitle'))}">
                </form>
            </div>
        `);

        if ($anchor.length) $anchor.after($wrap);
        else $gridToggle.before($wrap);

        const step = getScrollStep();
        const $input = $('#persona-scroll-step').val(step);
        updateQuickScrollTooltips(step);

        bindQuickScrollButton($('#persona-scroll-up'), -1);
        bindQuickScrollButton($('#persona-scroll-down'), 1);

        $('#persona-scroll-step-form').on('submit', (e) => {
            e.preventDefault();
            $input.blur();
        });

        $input.on('input', () => {
            const raw = String($input.val() || '').trim();
            if (!raw) return;
            const parsed = parseInt(raw, 10);
            if (!isNaN(parsed) && parsed >= 1 && parsed <= 999) {
                setScrollStep(parsed);
            }
        });

        $input.on('blur', () => {
            const parsed = parseInt(String($input.val() || '').trim(), 10);
            if (!isNaN(parsed) && parsed >= 1) {
                const saved = setScrollStep(parsed);
                $input.val(saved);
            } else {
                $input.val(getScrollStep());
            }
        });
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
                $info.text(pt('noCharacterSelected'));
            }
        } else {
            $info.text('');
        }
    }

    // ===== 标签筛选区（左栏，下拉框样式） =====
    let activeFilters = new Set();
    let filterMode = 'include'; // 'include' 正向 | 'exclude' 反向
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

        const filterText = escapeHtml(pt('tagFilter'));
        const toggleLabel = activeFilters.size > 0
            ? `<i class="fa-solid fa-filter"></i> ${filterText} <span class="filter-count">${activeFilters.size}</span> <i class="fa-solid fa-caret-${dropdownOpen ? 'up' : 'down'}" style="margin-left:2px"></i>`
            : `<i class="fa-solid fa-filter"></i> ${filterText} <i class="fa-solid fa-caret-${dropdownOpen ? 'up' : 'down'}" style="margin-left:2px"></i>`;
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
        const $clear = $(`<span class="persona-tag-clear-btn"><i class="fa-solid fa-xmark"></i> ${escapeHtml(pt('resetFilter'))}</span>`);
        $clear.on('click', () => {
            activeFilters.clear();
            renderFilterArea();
            applyFiltersAndRender();
        });
        $list.append($clear);

        // 正向/反向切换按钮
        const modeLabel = escapeHtml(filterMode === 'include' ? pt('filterModeInclude') : pt('filterModeExclude'));
        const modeTitle = escapeHtml(filterMode === 'include' ? pt('filterModeIncludeTitle') : pt('filterModeExcludeTitle'));
        const $modeBtn = $(`<span class="persona-filter-mode-btn${filterMode === 'exclude' ? ' exclude' : ''}" title="${modeTitle}"><i class="fa-solid fa-arrows-rotate"></i> ${modeLabel}</span>`);
        $modeBtn.on('click', () => {
            filterMode = filterMode === 'include' ? 'exclude' : 'include';
            renderFilterArea();
            applyFiltersAndRender();
        });
        $list.append($modeBtn);

        // 收集当前角色绑定人设的标签，用于高亮
        const connectedTags = new Set();
        const connectedIds = getConnectedPersonas();
        if (connectedIds) {
            for (const id of connectedIds) {
                for (const t of getPersonaTags(id)) connectedTags.add(t);
            }
        }

        for (const tag of allTags) {
            const color = getTagColor(tag);
            const isActive = activeFilters.has(tag);
            const isConnected = connectedTags.has(tag);
            const $btn = $('<span class="persona-tag-filter-btn"></span>')
                .toggleClass('active', isActive)
                .toggleClass('connected-highlight', isConnected)
                .css({ background: color.bg, color: color.fg })
                .attr('data-tag', tag)
                .text(tag);
            $btn.on('click', () => {
                if (isDragging) return;
                if (activeFilters.has(tag)) {
                    activeFilters.delete(tag);
                } else {
                    activeFilters.add(tag);
                }
                renderFilterArea();
                applyFiltersAndRender();
            });
            $list.append($btn);
        }

        $panel.append($list);
        $area.append($panel);
        initTagDrag($list[0]);
    }

    // ===== 标签拖拽排序 =====
    let isDragging = false;
    let dragState = null;

    function initTagDrag(listEl) {
        if (!listEl) return;
        const tagBtns = listEl.querySelectorAll('.persona-tag-filter-btn');
        tagBtns.forEach(btn => {
            btn.addEventListener('pointerdown', onDragPointerDown);
        });
    }

    function onDragPointerDown(e) {
        if (isDragging) return;
        const btn = e.currentTarget;
        const tag = btn.getAttribute('data-tag');
        if (!tag) return;

        const longPressTimer = setTimeout(() => {
            startDrag(btn, tag, e.clientX, e.clientY);
        }, 400);

        const cancelLongPress = () => {
            clearTimeout(longPressTimer);
            document.removeEventListener('pointermove', onEarlyMove);
            document.removeEventListener('pointerup', cancelLongPress);
            document.removeEventListener('pointercancel', cancelLongPress);
        };

        const onEarlyMove = (ev) => {
            const dx = ev.clientX - e.clientX;
            const dy = ev.clientY - e.clientY;
            if (dx * dx + dy * dy > 64) cancelLongPress();
        };

        document.addEventListener('pointermove', onEarlyMove);
        document.addEventListener('pointerup', cancelLongPress);
        document.addEventListener('pointercancel', cancelLongPress);
    }

    function startDrag(btn, tag, startX, startY) {
        isDragging = true;
        btn.classList.add('persona-tag-dragging-source');

        const rect = btn.getBoundingClientRect();
        const ghost = btn.cloneNode(true);
        ghost.className = 'persona-tag-filter-btn persona-tag-drag-ghost';
        ghost.style.cssText = btn.style.cssText;
        ghost.style.position = 'fixed';
        ghost.style.left = rect.left + 'px';
        ghost.style.top = rect.top + 'px';
        ghost.style.width = rect.width + 'px';
        ghost.style.zIndex = '99999';
        ghost.style.pointerEvents = 'none';
        document.body.appendChild(ghost);

        const listEl = btn.closest('.persona-filter-dropdown-list');
        const allBtns = [...listEl.querySelectorAll('.persona-tag-filter-btn')];
        const tagNames = allBtns.map(b => b.getAttribute('data-tag'));
        const sourceIndex = tagNames.indexOf(tag);

        dragState = {
            ghost, listEl, tag, sourceIndex, tagNames,
            allBtns, currentDropIndex: sourceIndex,
            offsetX: startX - rect.left,
            offsetY: startY - rect.top,
        };

        document.addEventListener('pointermove', onDragMove);
        document.addEventListener('pointerup', onDragEnd);
        document.addEventListener('pointercancel', onDragEnd);

        // 阻止手机滚动
        document.addEventListener('touchmove', preventScroll, { passive: false });
    }

    function preventScroll(e) { e.preventDefault(); }

    function onDragMove(e) {
        if (!dragState) return;
        const { ghost, allBtns, sourceIndex, offsetX, offsetY } = dragState;

        ghost.style.left = (e.clientX - offsetX) + 'px';
        ghost.style.top = (e.clientY - offsetY) + 'px';

        // 用 elementFromPoint 检测指针下方的标签
        ghost.style.display = 'none';
        const el = document.elementFromPoint(e.clientX, e.clientY);
        ghost.style.display = '';

        const targetBtn = el?.closest('.persona-tag-filter-btn');
        if (!targetBtn) return;
        const idx = allBtns.indexOf(targetBtn);
        if (idx === -1 || idx === sourceIndex) return;

        const r = targetBtn.getBoundingClientRect();
        const midX = r.left + r.width / 2;
        const dropIndex = e.clientX < midX ? idx : idx + 1;

        if (dropIndex !== dragState.currentDropIndex) {
            dragState.currentDropIndex = dropIndex;
            allBtns.forEach(b => b.classList.remove('persona-tag-drop-left', 'persona-tag-drop-right'));
            if (e.clientX < midX) {
                targetBtn.classList.add('persona-tag-drop-left');
            } else {
                targetBtn.classList.add('persona-tag-drop-right');
            }
        }
    }

    function onDragEnd() {
        if (!dragState) return;
        const { ghost, sourceIndex, currentDropIndex, tagNames } = dragState;

        document.removeEventListener('pointermove', onDragMove);
        document.removeEventListener('pointerup', onDragEnd);
        document.removeEventListener('pointercancel', onDragEnd);
        document.removeEventListener('touchmove', preventScroll);

        ghost.remove();

        if (sourceIndex !== currentDropIndex && currentDropIndex !== sourceIndex + 1) {
            const moved = tagNames.splice(sourceIndex, 1)[0];
            const insertAt = currentDropIndex > sourceIndex ? currentDropIndex - 1 : currentDropIndex;
            tagNames.splice(insertAt, 0, moved);
            saveTagOrder(tagNames);
        }

        dragState = null;
        isDragging = false;
        renderFilterArea();
        applyFiltersAndRender();
        if (currentPersonaAvatar) renderExistingTagsPicker(currentPersonaAvatar);
    }

    // ===== 批量选中状态 =====
    let batchMode = false;
    const selectedAvatars = new Set();

    function toggleSelection(avatarId) {
        if (selectedAvatars.has(avatarId)) selectedAvatars.delete(avatarId);
        else selectedAvatars.add(avatarId);
        applyFiltersAndRender();
        renderBatchToolbar();
    }

    function selectAllVisible() {
        const filtered = applyFilters();
        for (const id of filtered) selectedAvatars.add(id);
        applyFiltersAndRender();
        renderBatchToolbar();
    }

    function deselectAll() {
        selectedAvatars.clear();
        applyFiltersAndRender();
        renderBatchToolbar();
    }

    function pruneSelection(visibleIds) {
        for (const id of [...selectedAvatars]) {
            if (!visibleIds.includes(id)) selectedAvatars.delete(id);
        }
    }

    // ===== 批量操作工具栏 =====
    function renderBatchToolbar() {
        let $toolbar = $('#persona-batch-toolbar');

        if (!batchMode) {
            $toolbar.remove();
            return;
        }

        if (!$toolbar.length) {
            $toolbar = $('<div id="persona-batch-toolbar" class="persona-batch-toolbar"></div>');
            const $block = $('#user_avatar_block');
            if ($block.length) $block.before($toolbar);
            else return;
        }

        $toolbar.empty();

        // 选中计数
        $toolbar.append($('<span class="persona-batch-count"></span>').text(pt('batchSelectedCount', { count: selectedAvatars.size })));

        // 全选
        const $selectAll = $(`<span class="persona-batch-btn"><i class="fa-solid fa-check-double"></i> ${escapeHtml(pt('selectAll'))}</span>`);
        $selectAll.on('click', selectAllVisible);
        $toolbar.append($selectAll);

        // 取消
        const $deselect = $(`<span class="persona-batch-btn"><i class="fa-solid fa-xmark"></i> ${escapeHtml(pt('deselectAll'))}</span>`);
        $deselect.on('click', deselectAll);
        $toolbar.append($deselect);

        // 分隔符
        $toolbar.append('<span class="persona-batch-separator">|</span>');

        // 批量打标签
        const hasSelection = selectedAvatars.size > 0;
        const disabledClass = hasSelection ? '' : ' persona-batch-btn-disabled';

        const $addTags = $(`<span class="persona-batch-btn${disabledClass}"><i class="fa-solid fa-tags"></i> ${escapeHtml(pt('batchAddTagsBtn'))}</span>`);
        if (hasSelection) $addTags.on('click', batchAddTags);
        $toolbar.append($addTags);

        // 批量删标签
        const $removeTags = $(`<span class="persona-batch-btn${disabledClass}"><i class="fa-solid fa-tag"></i> ${escapeHtml(pt('batchRemoveTagsBtn'))}</span>`);
        if (hasSelection) $removeTags.on('click', batchRemoveTags);
        $toolbar.append($removeTags);

        // 批量删除
        const $del = $(`<span class="persona-batch-btn persona-batch-btn-danger${disabledClass}"><i class="fa-solid fa-trash"></i> ${escapeHtml(pt('batchDeleteBtn'))}</span>`);
        if (hasSelection) $del.on('click', batchDelete);
        $toolbar.append($del);
    }

    // ===== 批量操作 =====
    async function batchAddTags() {
        if (selectedAvatars.size === 0) return;
        const input = await showBatchInput(pt('batchAddTagsTitle'), pt('batchAddTagsMsg', { count: selectedAvatars.size }));
        if (!input) return;
        const parts = input.split(/[,，]/).map(s => s.trim()).filter(Boolean);
        if (parts.length === 0) return;
        let totalAdded = 0;
        try {
            for (const avatarId of selectedAvatars) {
                for (const tag of parts) {
                    if (addTagToPersona(avatarId, tag)) totalAdded++;
                }
            }
        } catch (e) {
            console.error(LOG, 'Batch add tags error:', e);
            toastr.error(pt('batchAddTagsError'));
        }
        if (totalAdded > 0) {
            toastr.success(pt('batchTagsAdded', { count: totalAdded }));
            applyFiltersAndRender();
            renderFilterArea();
            const cur = detectCurrentPersona() || currentPersonaAvatar;
            if (cur) renderTagEditor(cur);
        } else {
            toastr.warning(pt('allTagsAlreadyExist'));
        }
    }

    async function batchRemoveTags() {
        if (selectedAvatars.size === 0) return;
        // 收集选中人设的所有标签
        const tagCounts = {};
        for (const avatarId of selectedAvatars) {
            for (const tag of getPersonaTags(avatarId)) {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
        }
        const allTags = Object.keys(tagCounts);
        if (allTags.length === 0) {
            toastr.warning(pt('selectedPersonasNoTags'));
            return;
        }
        const toRemove = await showBatchTagPicker(pt('batchRemoveTagsTitle'), pt('batchRemoveTagsMsg', { count: selectedAvatars.size }), allTags, tagCounts);
        if (!toRemove || toRemove.length === 0) return;
        let totalRemoved = 0;
        try {
            for (const avatarId of selectedAvatars) {
                for (const tag of toRemove) {
                    if (getPersonaTags(avatarId).includes(tag)) {
                        removeTagFromPersona(avatarId, tag);
                        totalRemoved++;
                    }
                }
            }
        } catch (e) {
            console.error(LOG, 'Batch remove tags error:', e);
            toastr.error(pt('batchRemoveTagsError'));
        }
        if (totalRemoved > 0) {
            toastr.success(pt('batchTagsRemoved', { count: totalRemoved }));
            applyFiltersAndRender();
            renderFilterArea();
            const cur = detectCurrentPersona() || currentPersonaAvatar;
            if (cur) renderTagEditor(cur);
        }
    }

    async function batchDelete() {
        if (selectedAvatars.size === 0) return;
        const ctx = SillyTavern.getContext();
        const confirmed = await showBatchConfirm(
            pt('batchDeleteTitle'),
            pt('batchDeleteMsg', { count: selectedAvatars.size })
        );
        if (!confirmed) return;

        let deleted = 0;
        const failed = [];
        for (const avatarId of [...selectedAvatars]) {
            try {
                const resp = await fetch('/api/avatars/delete', {
                    method: 'POST',
                    headers: ctx.getRequestHeaders(),
                    body: JSON.stringify({ avatar: avatarId }),
                });
                if (resp.ok) {
                    if (ctx.powerUserSettings.personas) delete ctx.powerUserSettings.personas[avatarId];
                    if (ctx.powerUserSettings.persona_descriptions) delete ctx.powerUserSettings.persona_descriptions[avatarId];
                    selectedAvatars.delete(avatarId);
                    deleted++;
                } else {
                    failed.push(ctx.powerUserSettings.personas?.[avatarId] || avatarId);
                }
            } catch (e) {
                console.error(LOG, 'Failed to delete:', avatarId, e);
                failed.push(ctx.powerUserSettings.personas?.[avatarId] || avatarId);
            }
        }

        if (deleted > 0) {
            saveSettings();
            await refreshServerAvatars();
            purgeOrphanedEntries();
            if (currentPersonaAvatar && serverAvatarSet && !serverAvatarSet.has(currentPersonaAvatar)) {
                currentPersonaAvatar = null;
            }
            applyFiltersAndRender();
            renderFilterArea();
            renderBatchToolbar();
            renderTagEditor(detectCurrentPersona() || currentPersonaAvatar);
            toastr.success(pt('batchDeleted', { count: deleted }));
        }
        if (failed.length > 0) {
            toastr.error(pt('batchDeleteFailed', { count: failed.length, names: failed.join(pt('listSeparator')) }));
        }
    }

    function showBatchInput(title, message) {
        return new Promise(resolve => {
            const $overlay = $('<div class="persona-batch-overlay"></div>');
            const $dialog = $(`<div class="persona-batch-dialog">
                <div class="persona-batch-dialog-title"></div>
                <div class="persona-batch-dialog-msg"></div>
                <form class="persona-batch-dialog-form" autocomplete="off">
                    <input type="text" class="text_pole persona-batch-dialog-input" enterkeyhint="done">
                </form>
                <div class="persona-batch-dialog-buttons">
                    <span class="persona-batch-btn persona-batch-dialog-cancel"></span>
                    <span class="persona-batch-btn persona-batch-dialog-ok"></span>
                </div>
            </div>`);
            $dialog.find('.persona-batch-dialog-title').text(title);
            $dialog.find('.persona-batch-dialog-msg').text(message);
            $dialog.find('.persona-batch-dialog-input').attr('placeholder', pt('tagExamplesPlaceholder'));
            $dialog.find('.persona-batch-dialog-cancel').text(pt('cancelBtn'));
            $dialog.find('.persona-batch-dialog-ok').text(pt('confirmBtn'));
            $overlay.append($dialog);
            $overlay.on('mousedown pointerdown touchstart', (e) => e.stopPropagation());
            $('body').append($overlay);
            const close = (val) => { $overlay.remove(); resolve(val); };
            const getVal = () => $dialog.find('.persona-batch-dialog-input').val().trim();
            $dialog.find('.persona-batch-dialog-cancel').on('click', () => close(null));
            $overlay.on('click', (e) => { if (e.target === $overlay[0]) close(null); });
            $dialog.find('.persona-batch-dialog-form').on('submit', (e) => { e.preventDefault(); close(getVal()); });
            $dialog.find('.persona-batch-dialog-ok').on('click', () => close(getVal()));
            setTimeout(() => $dialog.find('.persona-batch-dialog-input').focus(), 50);
        });
    }

    function showBatchTagPicker(title, message, tags, tagCounts) {
        const picked = new Set();
        // 用 .attr()/.text() 构建，避免标签名中的 " < 等字符破坏 HTML
        const $picker = $('<div class="persona-batch-tag-picker"></div>');
        for (const tag of tags) {
            const color = getTagColor(tag);
            $picker.append($('<span class="persona-batch-tag-pill"></span>')
                .attr('data-tag', tag)
                .css({ background: color.bg, color: color.fg })
                .text(`${tag} (${tagCounts[tag]})`));
        }

        return new Promise(resolve => {
            const $overlay = $('<div class="persona-batch-overlay"></div>');
            const $dialog = $(`<div class="persona-batch-dialog">
                <div class="persona-batch-dialog-title"></div>
                <div class="persona-batch-dialog-msg"></div>
                <div class="persona-batch-dialog-buttons">
                    <span class="persona-batch-btn persona-batch-dialog-cancel"></span>
                    <span class="persona-batch-btn persona-batch-dialog-ok"></span>
                </div>
            </div>`);
            $dialog.find('.persona-batch-dialog-title').text(title);
            $dialog.find('.persona-batch-dialog-msg').text(message);
            $dialog.find('.persona-batch-dialog-cancel').text(pt('cancelBtn'));
            $dialog.find('.persona-batch-dialog-ok').text(pt('removeSelectedBtn'));
            $dialog.find('.persona-batch-dialog-msg').after($picker);
            $dialog.find('.persona-batch-tag-pill').on('click', function () {
                const tag = $(this).attr('data-tag');
                if (picked.has(tag)) { picked.delete(tag); $(this).removeClass('picked'); }
                else { picked.add(tag); $(this).addClass('picked'); }
            });
            $overlay.append($dialog);
            $overlay.on('mousedown pointerdown touchstart', (e) => e.stopPropagation());
            $('body').append($overlay);
            const close = (val) => { $overlay.remove(); resolve(val); };
            $dialog.find('.persona-batch-dialog-cancel').on('click', () => close(null));
            $overlay.on('click', (e) => { if (e.target === $overlay[0]) close(null); });
            $dialog.find('.persona-batch-dialog-ok').on('click', () => close([...picked]));
        });
    }

    function showBatchConfirm(title, message) {
        return new Promise(resolve => {
            const $overlay = $('<div class="persona-batch-overlay"></div>');
            const $dialog = $(`<div class="persona-batch-dialog">
                <div class="persona-batch-dialog-title"></div>
                <div class="persona-batch-dialog-msg"></div>
                <div class="persona-batch-dialog-buttons">
                    <span class="persona-batch-btn persona-batch-dialog-cancel"></span>
                    <span class="persona-batch-btn persona-batch-btn-danger persona-batch-dialog-ok"></span>
                </div>
            </div>`);
            $dialog.find('.persona-batch-dialog-title').text(title);
            $dialog.find('.persona-batch-dialog-msg').text(message);
            $dialog.find('.persona-batch-dialog-cancel').text(pt('cancelBtn'));
            $dialog.find('.persona-batch-dialog-ok').text(pt('confirmDeleteBtn'));
            $overlay.append($dialog);
            $overlay.on('mousedown pointerdown touchstart', (e) => e.stopPropagation());
            $('body').append($overlay);
            const close = (val) => { $overlay.remove(); resolve(val); };
            $dialog.find('.persona-batch-dialog-cancel').on('click', () => close(false));
            $overlay.on('click', (e) => { if (e.target === $overlay[0]) close(false); });
            $dialog.find('.persona-batch-dialog-ok').on('click', () => close(true));
        });
    }

    // ===== 纯数据筛选（不操作 DOM） =====

    /** 完整队列：只管视图模式 + 排序，不管标签/搜索筛选 */
    function getContextList() {
        const ctx = SillyTavern.getContext();
        let result = [...serverAvatarList];

        const connectedPersonas = (viewMode === 'connected') ? getConnectedPersonas() : null;
        if (connectedPersonas !== null) {
            const connectedSet = new Set(connectedPersonas);
            result = result.filter(avatarId => connectedSet.has(avatarId));
        }

        const order = getPersonaOrder();
        if (order.length > 0) {
            const orderMap = new Map(order.map((id, i) => [id, i]));
            result.sort((a, b) => {
                const ia = orderMap.has(a) ? orderMap.get(a) : Infinity;
                const ib = orderMap.has(b) ? orderMap.get(b) : Infinity;
                if (ia !== ib) return ia - ib;
                return (ctx.powerUserSettings.personas?.[a] || a).localeCompare(ctx.powerUserSettings.personas?.[b] || b);
            });
        } else {
            result.sort((a, b) => (ctx.powerUserSettings.personas?.[a] || a).localeCompare(ctx.powerUserSettings.personas?.[b] || b));
        }

        return result;
    }

    /** 在完整队列上再叠加标签/搜索筛选 */
    function applyFilters(cachedContextList) {
        const ctx = SillyTavern.getContext();
        let result = cachedContextList || getContextList();

        const searchTerm = ($('#persona_search_bar').val() || '').trim().toLowerCase();
        if (searchTerm) {
            result = result.filter(avatarId => {
                const name = (ctx.powerUserSettings.personas?.[avatarId] || '').toLowerCase();
                const desc = (ctx.powerUserSettings.persona_descriptions?.[avatarId]?.description || '').toLowerCase();
                return name.includes(searchTerm) || desc.includes(searchTerm);
            });
        }

        if (activeFilters.size > 0) {
            result = result.filter(avatarId => {
                const tags = getPersonaTags(avatarId);
                if (filterMode === 'include') {
                    return [...activeFilters].every(f => tags.includes(f));
                } else {
                    return ![...activeFilters].some(f => tags.includes(f));
                }
            });
        }

        return result;
    }

    // ===== 接管渲染 =====
    let isOwnRender = false;

    function getThumbnailUrl(avatarId) {
        return `/thumbnail?type=persona&file=${encodeURIComponent(avatarId)}`;
    }

    function buildPersonaCard(avatarId, index, noDescText) {
        const ctx = SillyTavern.getContext();
        const personaName = ctx.powerUserSettings.personas?.[avatarId] || pt('unnamedPersona');
        const desc = ctx.powerUserSettings.persona_descriptions?.[avatarId]?.description || '';
        const title = ctx.powerUserSettings.persona_descriptions?.[avatarId]?.title || '';
        noDescText = noDescText || '';

        const $card = $('<div class="avatar-container interactable"></div>').attr('data-avatar-id', avatarId).attr('tabindex', '0');

        // 批量选中复选框（仅在批量模式下显示）
        if (batchMode) {
            const isChecked = selectedAvatars.has(avatarId);
            const $checkWrap = $('<label class="persona-card-checkbox-wrap"></label>');
            const $check = $('<input type="checkbox" class="persona-card-checkbox">').prop('checked', isChecked);
            $checkWrap.on('click', (e) => e.stopPropagation());
            $check.on('change', () => toggleSelection(avatarId));
            $checkWrap.append($check);
            $card.append($checkWrap);
            $card.toggleClass('persona-card-selected', isChecked);
        }

        // 头像
        const $avatar = $('<div class="avatar"></div>').attr('data-avatar-id', avatarId).attr('title', avatarId);
        $avatar.append($('<img>').attr('src', getThumbnailUrl(avatarId)).attr('alt', 'User Avatar'));
        $card.append($avatar);

        // 信息容器
        const $info = $('<div class="flex-container wide100pLess70px character_select_container"></div>');

        // 名称 + 排序位号 + 标题
        const $nameBlock = $('<div class="wide100p character_name_block"></div>');
        const $name = $('<span class="ch_name flex1"></span>').text(personaName);
        $name.append($('<span class="persona-position-badge"></span>').text(`(${index + 1})`));
        $nameBlock.append($name);
        $nameBlock.append($('<small class="ch_additional_info"></small>').text(title));
        $info.append($nameBlock);

        // 描述
        let displayDesc = desc || noDescText;
        if (displayDesc.split('\n').length < 3) displayDesc += '\n\xa0\n\xa0';
        $info.append($('<div class="ch_description"></div>').text(displayDesc).toggleClass('text_muted', !desc));

        // 标签（直接内嵌，替代旧的 renderCardTags）
        const tags = getPersonaTags(avatarId);
        if (tags.length > 0) {
            const $tags = $('<span class="persona-card-tags"></span>');
            for (const tag of tags) {
                const color = getTagColor(tag);
                $tags.append($('<span class="persona-card-tag"></span>').css({ background: color.bg, color: color.fg }).text(tag));
            }
            $info.append($tags);
        }

        // 锁定状态标签（保留 ST 原生结构，文字跟随 ST 语言）
        const chatLabel = typeof ctx.translate === 'function' ? ctx.translate('Chat') : 'Chat';
        const charLabel = typeof ctx.translate === 'function' ? ctx.translate('Character') : 'Character';
        $info.append(`<div class="avatar_container_states buttons_block">
            <div class="locked_to_chat_label avatar_state has_hover_label menu_button menu_button_icon disabled">
                <i class="icon fa-solid fa-lock fa-fw"></i>
                <i class="label_icon icon fa-solid fa-comments fa-fw"></i>
                <div class="label">${escapeHtml(chatLabel)}</div>
            </div>
            <div class="locked_to_character_label avatar_state has_hover_label menu_button menu_button_icon disabled">
                <i class="icon fa-solid fa-lock fa-fw"></i>
                <i class="label_icon icon fa-solid fa-user fa-fw"></i>
                <div class="label">${escapeHtml(charLabel)}</div>
            </div>
        </div>`);

        $card.append($info);

        // 人设状态 class
        $card.toggleClass('default_persona', avatarId === ctx.powerUserSettings.default_persona);
        $card.toggleClass('selected', avatarId === currentPersonaAvatar);
        const chatPersona = (ctx.chatMetadata || ctx.chat_metadata)?.persona;
        $card.toggleClass('locked_to_chat', chatPersona === avatarId);
        const connections = ctx.powerUserSettings.persona_descriptions?.[avatarId]?.connections || [];
        let isCharLocked = false;
        if (ctx.groupId) {
            isCharLocked = connections.some(c => c.type === 'group' && c.id === ctx.groupId);
        } else if (ctx.characterId != null) {
            const charAvatar = ctx.characters?.[ctx.characterId]?.avatar;
            isCharLocked = charAvatar && connections.some(c => c.type === 'character' && c.id === charAvatar);
        }
        $card.toggleClass('locked_to_character', isCharLocked);

        return $card;
    }

    function renderPersonaList(filteredList, contextList) {
        const $block = $('#user_avatar_block');
        if (!$block.length) return;

        isOwnRender = true;
        const noDescText = $block.attr('no_desc_text') || '';
        $block.empty();

        if (filteredList.length === 0) {
            $block.append($('<div class="persona-empty-placeholder"></div>').text(pt('noMatchingPersonas')));
        } else {
            const ctx = contextList || getContextList();
            for (const avatarId of filteredList) {
                const globalPos = ctx.indexOf(avatarId);
                $block.append(buildPersonaCard(avatarId, globalPos, noDescText));
            }
        }

        setTimeout(() => { isOwnRender = false; }, 0);
    }

    function applyFiltersAndRender() {
        if (serverAvatarList.length === 0) return;
        const contextList = getContextList();
        const filtered = applyFilters(contextList);
        pruneSelection(filtered);
        renderPersonaList(filtered, contextList);
        renderBatchToolbar();
        initPersonaDrag();
    }

    // ===== 人设卡片拖拽排序 =====
    let personaDragState = null;

    function initPersonaDrag() {
        const block = document.getElementById('user_avatar_block');
        if (!block) return;
        block.querySelectorAll('.avatar-container').forEach(card => {
            card.addEventListener('pointerdown', onPersonaDragPointerDown);
        });
    }

    function onPersonaDragPointerDown(e) {
        if (personaDragState) return;
        // 复选框区域不触发拖拽
        if (e.target.closest('.persona-card-checkbox-wrap')) return;
        const card = e.currentTarget;
        const avatarId = card.getAttribute('data-avatar-id');
        if (!avatarId) return;

        const suppressCtxMenu = (ev) => ev.preventDefault();
        document.addEventListener('contextmenu', suppressCtxMenu);

        const longPressTimer = setTimeout(() => {
            document.removeEventListener('contextmenu', suppressCtxMenu);
            startPersonaDrag(card, avatarId, e.clientX, e.clientY);
        }, 400);

        const cancelLongPress = () => {
            clearTimeout(longPressTimer);
            document.removeEventListener('contextmenu', suppressCtxMenu);
            document.removeEventListener('pointermove', onEarlyMove);
            document.removeEventListener('pointerup', cancelLongPress);
            document.removeEventListener('pointercancel', cancelLongPress);
        };

        const onEarlyMove = (ev) => {
            const dx = ev.clientX - e.clientX;
            const dy = ev.clientY - e.clientY;
            if (dx * dx + dy * dy > 64) cancelLongPress();
        };

        document.addEventListener('pointermove', onEarlyMove);
        document.addEventListener('pointerup', cancelLongPress);
        document.addEventListener('pointercancel', cancelLongPress);
    }

    function startPersonaDrag(card, avatarId, startX, startY) {
        const ctx = SillyTavern.getContext();
        const personaName = ctx.powerUserSettings.personas?.[avatarId] || avatarId;
        card.classList.add('persona-card-dragging-source');

        // 简洁的拖拽幽灵（只显示名字）
        const ghost = document.createElement('div');
        ghost.className = 'persona-card-drag-ghost';
        ghost.textContent = personaName;
        ghost.style.position = 'fixed';
        ghost.style.left = startX + 'px';
        ghost.style.top = (startY - 16) + 'px';
        ghost.style.zIndex = '99999';
        ghost.style.pointerEvents = 'none';
        document.body.appendChild(ghost);

        const block = document.getElementById('user_avatar_block');
        const allCards = [...block.querySelectorAll('.avatar-container')];
        const avatarIds = allCards.map(c => c.getAttribute('data-avatar-id'));
        const sourceIndex = avatarIds.indexOf(avatarId);

        personaDragState = {
            ghost, card, avatarId, sourceIndex, avatarIds, allCards,
            currentDropIndex: sourceIndex,
            offsetX: 0, offsetY: 16,
            orderKey: getOrderKey(),
        };

        document.addEventListener('pointermove', onPersonaDragMove);
        document.addEventListener('pointerup', onPersonaDragEnd);
        document.addEventListener('pointercancel', onPersonaDragEnd);
        document.addEventListener('touchmove', preventScroll, { passive: false });
    }


    function onPersonaDragMove(e) {
        if (!personaDragState) return;
        const { ghost, allCards, sourceIndex } = personaDragState;

        ghost.style.left = e.clientX + 'px';
        ghost.style.top = (e.clientY - personaDragState.offsetY) + 'px';

        // 拖拽到边缘时自动滚动容器
        const block = document.getElementById('user_avatar_block');
        if (block) {
            const rect = block.getBoundingClientRect();
            const edge = 40;
            if (e.clientY < rect.top + edge && block.scrollTop > 0) {
                block.scrollTop -= 8;
            } else if (e.clientY > rect.bottom - edge) {
                block.scrollTop += 8;
            }
        }

        ghost.style.display = 'none';
        const el = document.elementFromPoint(e.clientX, e.clientY);
        ghost.style.display = '';

        const targetCard = el?.closest('.avatar-container');
        allCards.forEach(c => c.classList.remove('persona-card-drop-above', 'persona-card-drop-below'));

        if (!targetCard) return;
        const idx = allCards.indexOf(targetCard);
        if (idx === -1 || idx === sourceIndex) return;

        const r = targetCard.getBoundingClientRect();
        const midY = r.top + r.height / 2;
        const dropIndex = e.clientY < midY ? idx : idx + 1;

        personaDragState.currentDropIndex = dropIndex;
        if (e.clientY < midY) {
            targetCard.classList.add('persona-card-drop-above');
        } else {
            targetCard.classList.add('persona-card-drop-below');
        }
    }

    function onPersonaDragEnd() {
        if (!personaDragState) return;
        const { ghost, card, sourceIndex, currentDropIndex, avatarIds, orderKey } = personaDragState;

        document.removeEventListener('pointermove', onPersonaDragMove);
        document.removeEventListener('pointerup', onPersonaDragEnd);
        document.removeEventListener('pointercancel', onPersonaDragEnd);
        document.removeEventListener('touchmove', preventScroll);

        ghost.remove();
        card.classList.remove('persona-card-dragging-source');
        document.querySelectorAll('.persona-card-drop-above, .persona-card-drop-below').forEach(
            c => c.classList.remove('persona-card-drop-above', 'persona-card-drop-below')
        );

        if (sourceIndex !== currentDropIndex && currentDropIndex !== sourceIndex + 1) {
            // 计算新的可见顺序
            const newVisible = [...avatarIds];
            const moved = newVisible.splice(sourceIndex, 1)[0];
            const insertAt = currentDropIndex > sourceIndex ? currentDropIndex - 1 : currentDropIndex;
            newVisible.splice(insertAt, 0, moved);

            // 将新的可见顺序合并回完整排序（只改可见项的相对位置）
            // 使用拖拽开始时捕获的 orderKey，避免角色切换导致存错位置
            const obj = ensurePersonaOrderObj();
            const fullOrder = obj[orderKey] || [];
            const visibleSet = new Set(avatarIds);
            const merged = [];
            let vi = 0;
            for (const id of fullOrder) {
                if (visibleSet.has(id)) {
                    merged.push(newVisible[vi++]);
                } else {
                    merged.push(id);
                }
            }
            for (; vi < newVisible.length; vi++) {
                merged.push(newVisible[vi]);
            }
            obj[orderKey] = merged;
            saveSettings();
        }

        personaDragState = null;
        applyFiltersAndRender();
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

    // ===== 备份/恢复增强 =====

    function downloadFile(jsonStr, filename) {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function mergePersonaTagsData(incoming) {
        if (!incoming || typeof incoming !== 'object') return 0;
        const settings = getSettings();
        let count = 0;

        // tagMap: union 合并（现有标签在前，新标签追加）
        if (incoming.tagMap && typeof incoming.tagMap === 'object') {
            for (const [avatarId, tags] of Object.entries(incoming.tagMap)) {
                if (!Array.isArray(tags)) continue;
                const existing = settings.tagMap[avatarId] || [];
                const existingSet = new Set(existing);
                const merged = [...existing];
                for (const rawTag of tags) {
                    if (typeof rawTag !== 'string') continue;
                    const tag = rawTag.trim();
                    if (tag && !existingSet.has(tag)) {
                        merged.push(tag);
                        existingSet.add(tag);
                    }
                }
                if (merged.length > existing.length) {
                    settings.tagMap[avatarId] = merged;
                    count++;
                }
            }
        }

        // tagOrder: 追加新标签到末尾
        if (Array.isArray(incoming.tagOrder)) {
            const order = settings.tagOrder || [];
            const orderSet = new Set(order);
            for (const rawTag of incoming.tagOrder) {
                if (typeof rawTag !== 'string') continue;
                const tag = rawTag.trim();
                if (tag && !orderSet.has(tag)) {
                    order.push(tag);
                    orderSet.add(tag);
                }
            }
            settings.tagOrder = order;
        }

        // personaOrder: 按 key skip 已存在的排序
        if (incoming.personaOrder && typeof incoming.personaOrder === 'object') {
            const obj = ensurePersonaOrderObj();
            for (const [key, order] of Object.entries(incoming.personaOrder)) {
                if (!Array.isArray(order)) continue;
                if (!obj[key]) obj[key] = [...order];
            }
        }

        // scrollStep: 仅在当前未自定义时恢复
        if (settings.scrollStep == null && Number.isInteger(Number(incoming.scrollStep))) {
            const s = Number(incoming.scrollStep);
            if (s >= 1 && s <= 999) {
                settings.scrollStep = s;
                if ($('#persona-scroll-step').length) {
                    $('#persona-scroll-step').val(s);
                    updateQuickScrollTooltips(s);
                }
            }
        }

        saveSettings();
        return count;
    }

    let backupRestoreHooked = false;
    let isRestoring = false;

    function setupBackupRestoreHooks() {
        if (backupRestoreHooked) return;
        backupRestoreHooked = true;

        // 备份拦截：capture-phase 先于 ST 的 jQuery handler
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#personas_backup')) return;
            e.stopImmediatePropagation();
            e.preventDefault();

            const ctx = SillyTavern.getContext();
            const settings = getSettings();
            const data = JSON.stringify({
                personas: ctx.powerUserSettings.personas || {},
                persona_descriptions: ctx.powerUserSettings.persona_descriptions || {},
                default_persona: ctx.powerUserSettings.default_persona || null,
                personaTags: {
                    tagMap: settings.tagMap || {},
                    tagOrder: settings.tagOrder || [],
                    personaOrder: ensurePersonaOrderObj(),
                    scrollStep: getScrollStep(),
                },
            }, null, 2);

            const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
            downloadFile(data, `personas_${timestamp}.json`);
            toastr.success(pt('backupExported'));
        }, true);

        // 恢复拦截：读取文件提取插件数据后放行给 ST
        document.addEventListener('change', async (e) => {
            if (e.target.id !== 'personas_restore_input') return;
            if (isRestoring) return;
            const file = e.target.files?.[0];
            if (!file) return;
            e.stopImmediatePropagation();
            isRestoring = true;

            let hasPluginData = false;
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                if (data.personaTags) {
                    const count = mergePersonaTagsData(data.personaTags);
                    toastr.success(pt('backupTagsRestored', { count }));
                    hasPluginData = true;
                }
            } catch (err) {
                console.error(LOG, 'Failed to extract plugin data from backup:', err);
            }

            if (!hasPluginData) {
                toastr.info(pt('backupNoPluginData'));
            }

            $(e.target).trigger('change');
            isRestoring = false;
        }, true);
    }

    // ===== 复制人设增强 =====
    let pendingDuplication = null;
    let pendingCreationTags = null;
    let lastDupeCopyTags = false;
    let lastDupeCopyConnections = false;

    /** 兼容 ST 多语言的弹窗文案匹配（优先使用 ST 当前语言包翻译，兼容英文及常见中文回退） */
    function matchesSTText(actualText, enKey, fallbacks = []) {
        if (!actualText) return false;
        const ctx = SillyTavern.getContext();
        const translated = typeof ctx.translate === 'function' ? ctx.translate(enKey) : '';
        if (translated && actualText.includes(translated)) return true;
        if (actualText.includes(enKey)) return true;
        return fallbacks.some(f => f && actualText.includes(f));
    }

    function enhanceDuplicateDialog(dialog) {
        dialog.classList.add('persona-dupe-modified');

        // 仅在简体中文模式下补汉化英文弹窗标题（其他语言保持 ST 原生文案）
        const contentEl = dialog.querySelector('.popup-content');
        if (isZhCn() && contentEl) {
            contentEl.querySelectorAll('h3').forEach(h => {
                if (h.textContent.includes('duplicate this persona')) {
                    h.textContent = '复制人设';
                }
            });
        }

        const okBtn = dialog.querySelector('.popup-button-ok');
        const cancelBtn = dialog.querySelector('.popup-button-cancel');

        if (cancelBtn) {
            if (isZhCn() && /^(Cancel|No|否)$/i.test(cancelBtn.textContent.trim())) {
                cancelBtn.textContent = '取消';
            }
            cancelBtn.addEventListener('click', () => {
                pendingDuplication = null;
            }, true);
        }
        dialog.addEventListener('cancel', () => {
            pendingDuplication = null;
        });

        if (okBtn) {
            okBtn.style.display = 'none';

            const controls = dialog.querySelector('.popup-controls');
            if (controls) {
                // 勾选区
                const optionsDiv = document.createElement('div');
                optionsDiv.className = 'persona-dupe-options';

                const tagLabel = document.createElement('label');
                tagLabel.className = 'persona-dupe-checkbox';
                const tagCheck = document.createElement('input');
                tagCheck.type = 'checkbox';
                tagCheck.checked = lastDupeCopyTags;
                tagLabel.append(tagCheck, ' ' + pt('dupeCopyTags'));

                const connLabel = document.createElement('label');
                connLabel.className = 'persona-dupe-checkbox';
                const connCheck = document.createElement('input');
                connCheck.type = 'checkbox';
                connCheck.checked = lastDupeCopyConnections;
                connLabel.append(connCheck, ' ' + pt('dupeCopyConnections'));

                optionsDiv.append(tagLabel, connLabel);

                // 勾选状态实时同步 + 刷新时间戳（兼顾按钮点击、键盘回车和长停留不超时）
                const syncDupeOptions = () => {
                    lastDupeCopyTags = tagCheck.checked;
                    lastDupeCopyConnections = connCheck.checked;
                    if (pendingDuplication) {
                        pendingDuplication.copyTags = tagCheck.checked;
                        pendingDuplication.copyConnections = connCheck.checked;
                        pendingDuplication.timestamp = Date.now();
                    }
                };
                tagCheck.addEventListener('change', syncDupeOptions);
                connCheck.addEventListener('change', syncDupeOptions);
                syncDupeOptions();

                // 复制按钮
                const confirmBtn = document.createElement('div');
                confirmBtn.className = 'menu_button popup-button-custom result-control';
                confirmBtn.tabIndex = 0;
                confirmBtn.textContent = pt('dupeConfirmBtn');
                confirmBtn.addEventListener('click', () => {
                    syncDupeOptions();
                    okBtn.click();
                });

                dialog.addEventListener('keydown', (e) => {
                    if (e.isComposing) return;
                    if (e.key === 'Enter') {
                        if (document.activeElement?.closest('.popup-button-cancel')) {
                            pendingDuplication = null;
                            return;
                        }
                        syncDupeOptions();
                        if (e.target === tagCheck || e.target === connCheck || e.target === confirmBtn) {
                            e.preventDefault();
                            e.stopPropagation();
                            okBtn.click();
                        }
                    } else if (e.key === 'Escape') {
                        pendingDuplication = null;
                    }
                }, true);

                // 插入到弹窗内容区底部
                const popupContent = dialog.querySelector('.popup-content');
                if (popupContent) {
                    popupContent.appendChild(optionsDiv);
                }

                controls.prepend(confirmBtn);
                confirmBtn.focus();
            }
        }
    }

    async function handlePendingCreationTags() {
        if (!pendingCreationTags) return;
        if (Date.now() - pendingCreationTags.timestamp > 120000) {
            pendingCreationTags = null;
            return;
        }
        const ctx = SillyTavern.getContext();
        const currentIds = new Set(Object.keys(ctx.powerUserSettings.personas));
        for (const id of currentIds) {
            if (!pendingCreationTags.existingIds.has(id)) {
                for (const tag of pendingCreationTags.tags) {
                    addTagToPersona(id, tag);
                }
                console.log(LOG, 'Applied creation tags to new persona:', id, pendingCreationTags.tags);
                pendingCreationTags = null;
                await refreshServerAvatars();
                applyFiltersAndRender();
                renderFilterArea();
                if (currentPersonaAvatar === id) renderTagEditor(id);
                return;
            }
        }
    }

    function handlePendingDuplication() {
        if (!pendingDuplication) return;
        if (Date.now() - pendingDuplication.timestamp > 30000) {
            console.log(LOG, 'Pending duplication expired');
            pendingDuplication = null;
            return;
        }

        const ctx = SillyTavern.getContext();
        const currentIds = new Set(Object.keys(ctx.powerUserSettings.personas));

        // 找到新出现的人设 ID
        for (const id of currentIds) {
            if (!pendingDuplication.existingIds.has(id)) {
                if (pendingDuplication.copyTags) {
                    const sourceTags = getPersonaTags(pendingDuplication.sourceAvatarId);
                    if (sourceTags.length > 0) {
                        setPersonaTags(id, [...sourceTags]);
                        console.log(LOG, 'Copied tags to duplicated persona:', id);
                    }
                }
                if (pendingDuplication.copyConnections) {
                    const descriptions = ctx.powerUserSettings.persona_descriptions;
                    const sourceConns = descriptions?.[pendingDuplication.sourceAvatarId]?.connections;
                    if (sourceConns && sourceConns.length > 0) {
                        if (!descriptions[id]) descriptions[id] = {};
                        descriptions[id].connections = sourceConns.map(c => ({ ...c }));
                        saveSettings();
                        console.log(LOG, 'Copied connections to duplicated persona:', id);
                    }
                }
                pendingDuplication = null;
                return;
            }
        }
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

            const name = personas[pid] || pt('unnamedShort');
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

        // 弹窗文字补汉化（仅简体中文模式生效，避免覆盖其他语言的 ST 原生文案）
        const dialog = personaList.closest('dialog');
        if (dialog && isZhCn()) {
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
        let popupDebounce = null;
        new MutationObserver((mutations) => {
            // 只在有新节点添加时才处理（过滤属性变化等噪声）
            const hasAdded = mutations.some(m => m.addedNodes.length > 0);
            if (!hasAdded) return;
            if (popupDebounce) return;
            popupDebounce = requestAnimationFrame(() => {
                popupDebounce = null;
                processPopups();
            });
        }).observe(document.body, { childList: true, subtree: true });

        function processPopups() {
            // 每次 DOM 变化时检查是否有未增强的 .persona-list
            document.querySelectorAll('.persona-list:not(.persona-popup-enhanced)').forEach(el => {
                if (el.querySelector('.avatar[data-type="persona"]')) {
                    enhancePersonaPopup(el);
                }
            });

            // 检测复制人设的确认弹窗并增强（全语言兼容）
            if (pendingDuplication) {
                document.querySelectorAll('dialog.popup:not(.persona-dupe-modified)').forEach(dialog => {
                    const text = dialog.querySelector('.popup-content')?.textContent || '';
                    if (matchesSTText(text, 'Are you sure you want to duplicate this persona?', ['duplicate this persona', '确定要复制此用户设定', '複製使用者角色'])) {
                        enhanceDuplicateDialog(dialog);
                    }
                });
            }

            // 注入新建人设标签框（全语言） & 补汉化 ST 原生弹窗（仅简体中文模式）
            const zhCn = isZhCn();
            document.querySelectorAll('dialog.popup:not(.persona-cn-done)').forEach(dialog => {
                const content = dialog.querySelector('.popup-content');
                if (!content) return;
                const text = content.textContent || '';
                let matched = false;

                // 创建/重命名人设弹窗（全语言识别创建弹窗）
                const isNamePrompt = matchesSTText(text, 'Enter a name for this persona:', ['Enter a name for this persona', '为此用户设定命名', '輸入使用者角色的名稱']);
                const isRename = matchesSTText(text, 'Rename Persona', ['Rename Persona', '重命名人设', '重新命名使用者角色']);
                const isCreate = isNamePrompt && !isRename;
                if (isNamePrompt || isRename) {
                    if (zhCn) {
                        content.querySelectorAll('h3').forEach(h => {
                            if (h.textContent.includes('Rename Persona')) h.textContent = '重命名人设';
                            if (h.textContent.includes('Enter a name for this persona')) h.textContent = '请输入人设名称：';
                        });
                        content.querySelectorAll('label').forEach(l => {
                            if (l.textContent.includes('Persona Title')) l.textContent = '人设标题（可选，仅用于显示）';
                        });
                    }
                    // 创建弹窗注入标签输入框（全语言通吃）
                    if (isCreate && !dialog.querySelector('.persona-create-tags-input')) {
                        const controls = dialog.querySelector('.popup-controls') || dialog.querySelector('.popup-content');
                        if (controls) {
                            const tagDiv = document.createElement('div');
                            tagDiv.style.cssText = 'margin: 8px 0; width: 100%;';
                            const tagLabelEl = document.createElement('label');
                            tagLabelEl.style.cssText = 'font-size:0.9em;opacity:0.7;';
                            tagLabelEl.textContent = pt('createTagsLabel');
                            const tagInputEl = document.createElement('input');
                            tagInputEl.className = 'text_pole result-control persona-create-tags-input';
                            tagInputEl.type = 'text';
                            tagInputEl.placeholder = pt('tagExamplesPlaceholder');
                            tagInputEl.style.cssText = 'width:100%;box-sizing:border-box;margin-top:4px;';
                            tagDiv.append(tagLabelEl, tagInputEl);
                            const popupContent = dialog.querySelector('.popup-content');
                            if (popupContent) popupContent.appendChild(tagDiv);
                        }
                        const captureCreationTags = () => {
                            const nameInput = dialog.querySelector('.popup-input');
                            if (nameInput && !nameInput.value.trim()) {
                                pendingCreationTags = null;
                                return;
                            }
                            const tagInput = dialog.querySelector('.persona-create-tags-input');
                            const raw = tagInput ? tagInput.value.trim() : '';
                            const tags = raw.split(/[,，]/).map(s => s.trim()).filter(Boolean);
                            if (tags.length > 0) {
                                const ctx = SillyTavern.getContext();
                                pendingCreationTags = {
                                    tags,
                                    existingIds: new Set(Object.keys(ctx.powerUserSettings.personas)),
                                    timestamp: Date.now(),
                                };
                                console.log(LOG, 'Pending creation tags:', tags);
                            } else {
                                pendingCreationTags = null;
                            }
                        };
                        // 拦截保存按钮与键盘回车，记录待创建的标签
                        const okBtn = dialog.querySelector('.popup-button-ok');
                        const cancelBtn = dialog.querySelector('.popup-button-cancel');
                        if (okBtn) {
                            okBtn.addEventListener('click', captureCreationTags, true);
                        }
                        if (cancelBtn) {
                            cancelBtn.addEventListener('click', () => { pendingCreationTags = null; }, true);
                        }
                        dialog.addEventListener('cancel', () => { pendingCreationTags = null; });
                        dialog.addEventListener('keydown', (e) => {
                            if (e.isComposing) return;
                            if (e.key === 'Enter') {
                                if (document.activeElement?.closest('.popup-button-cancel')) {
                                    pendingCreationTags = null;
                                } else {
                                    captureCreationTags();
                                }
                            } else if (e.key === 'Escape') {
                                pendingCreationTags = null;
                            }
                        }, true);
                    }
                    matched = true;
                }
                if (zhCn && text.includes('Cancel if you')) {
                    content.querySelectorAll('h3').forEach(h => {
                        if (h.textContent.includes('Enter a name for this persona')) h.textContent = '请输入人设名称：';
                    });
                    content.querySelectorAll('.multiline, p, div').forEach(el => {
                        if (el.textContent.includes('Cancel if you\'re just uploading')) {
                            el.textContent = '如果只是上传头像可以取消。';
                        }
                        if (el.textContent.includes('You can always add or change it later')) {
                            el.textContent = '之后还可以修改。';
                        }
                    });
                    content.querySelectorAll('label').forEach(l => {
                        if (l.textContent.includes('Persona Title')) l.textContent = '人设标题（可选，仅用于显示）';
                    });
                    matched = true;
                }
                // 删除确认弹窗（仅简体中文模式补汉化）
                if (zhCn && text.includes('Are you sure you want to delete this avatar')) {
                    content.querySelectorAll('h3').forEach(h => {
                        if (h.textContent.includes('Delete Persona')) h.textContent = '删除人设';
                    });
                    content.querySelectorAll('span, div, p').forEach(el => {
                        if (el.textContent.includes('Are you sure you want to delete this avatar')) {
                            el.innerHTML = '确定要删除这个头像吗？<br>关联的人设信息将全部丢失。';
                        }
                    });
                    matched = true;
                }
                // 描述输入弹窗（上传头像创建人设的第二步，全语言刷新待创建标签超时，仅简体中文补汉化）
                if (matchesSTText(text, 'Enter a description for this persona:', ['Enter a description for this persona', '描述这个用户设定', '輸入此使用者角色的描述'])) {
                    if (zhCn) {
                        content.querySelectorAll('h3').forEach(h => {
                            if (h.textContent.includes('Enter a description')) h.textContent = '请输入人设描述：';
                        });
                        content.querySelectorAll('.multiline, p, div').forEach(el => {
                            if (el.textContent.includes('You can always add or change it later')) {
                                el.textContent = '之后还可以修改。';
                            }
                        });
                    }
                    if (pendingCreationTags) {
                        const refreshCreationTs = () => {
                            if (pendingCreationTags) pendingCreationTags.timestamp = Date.now();
                        };
                        dialog.querySelector('.popup-button-ok')?.addEventListener('click', refreshCreationTs, true);
                        dialog.querySelector('.popup-button-cancel')?.addEventListener('click', refreshCreationTs, true);
                        dialog.addEventListener('keydown', (e) => {
                            if (!e.isComposing && (e.key === 'Enter' || e.key === 'Escape')) refreshCreationTs();
                        }, true);
                    }
                    matched = true;
                }

                if (matched) {
                    dialog.classList.add('persona-cn-done');
                    if (zhCn) {
                        const okBtn = dialog.querySelector('.popup-button-ok');
                        const cancelBtn = dialog.querySelector('.popup-button-cancel');
                        if (okBtn && okBtn.textContent.trim() === 'OK') okBtn.textContent = '保存';
                        if (cancelBtn && cancelBtn.textContent.trim() === 'Cancel') cancelBtn.textContent = '取消';
                    }
                }
            });
        }
    }

    // ===== 初始化 =====
    async function init() {
        console.log(LOG, 'Initializing...');

        getSettings();
        await Promise.all([loadLocale(), refreshServerAvatars()]);
        purgeOrphanedSTEntries();
        purgeOrphanedEntries();
        purgeOrphanedOrders();
        setupBackupRestoreHooks();
        injectTagEditor();
        injectViewModeToggle();
        injectQuickScrollControls();
        startPopupObserver();

        // 记录当前选中的人设（在接管渲染前从 DOM 读取）
        currentPersonaAvatar = detectCurrentPersona();

        // 初次接管渲染
        applyFiltersAndRender();
        renderFilterArea();

        if (currentPersonaAvatar) renderTagEditor(currentPersonaAvatar);

        // 如果当前没有角色卡，默认切到"全部"模式
        if (getConnectedPersonas() === null) {
            viewMode = 'all';
            $('.persona-view-mode-btn').removeClass('active');
            $('.persona-view-mode-btn[data-mode="all"]').addClass('active');
            updateViewModeInfo();
        }

        // 监听人设选择点击（更新当前人设跟踪 + 右栏标签编辑器）
        $(document).on('click', '#user_avatar_block .avatar-container', function (e) {
            // 复选框点击不触发选中（Phase C 会用到）
            if ($(e.target).closest('.persona-card-checkbox-wrap').length) return;
            const avatarId = $(this).attr('data-avatar-id');
            currentPersonaAvatar = avatarId;
            setTimeout(() => {
                applyFiltersAndRender();
                renderTagEditor(avatarId);
            }, 100);
        });

        // 监听 ST 生命周期事件：就绪后再清理孤儿排序 + 非列表切人设时同步右栏
        const initCtx = SillyTavern.getContext();
        if (initCtx.eventSource && initCtx.eventTypes) {
            if (initCtx.eventTypes.APP_READY) {
                initCtx.eventSource.on(initCtx.eventTypes.APP_READY, () => {
                    purgeOrphanedOrders();
                });
            }
            if (initCtx.eventTypes.PERSONA_CHANGED) {
                initCtx.eventSource.on(initCtx.eventTypes.PERSONA_CHANGED, (avatarId) => {
                    if (avatarId && avatarId !== currentPersonaAvatar) {
                        currentPersonaAvatar = avatarId;
                        renderTagEditor(avatarId);
                        $('#user_avatar_block .avatar-container').each(function () {
                            $(this).toggleClass('selected', $(this).attr('data-avatar-id') === avatarId);
                        });
                    }
                });
            }
        }

        // 监听搜索框输入，用我们的渲染响应
        let searchDebounce = null;
        $(document).on('input', '#persona_search_bar', () => {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(() => applyFiltersAndRender(), 150);
        });

        // 监听复制按钮：捕获阶段优先于 ST 的处理，确保 pendingDuplication 先被设置
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#persona_duplicate_button')) return;
            const sourceAvatarId = detectCurrentPersona() || currentPersonaAvatar;
            if (!sourceAvatarId) return;
            const ctx = SillyTavern.getContext();
            if (!ctx.powerUserSettings.personas[sourceAvatarId]) return;
            pendingDuplication = {
                sourceAvatarId,
                copyTags: lastDupeCopyTags,
                copyConnections: lastDupeCopyConnections,
                existingIds: new Set(Object.keys(ctx.powerUserSettings.personas)),
                timestamp: Date.now(),
            };
            console.log(LOG, 'Pending duplication set for:', sourceAvatarId);
        }, true); // 捕获阶段

        // MutationObserver：接管渲染 — 拦截 ST 的重绘，替换为我们的卡片
        let takeoverDebounce = null;
        const block = document.getElementById('user_avatar_block');
        if (block) {
            // ST 编辑人设（改名、改标题、换头像等）后会重画列表并滚回顶部，
            // 这里随时记录滚动位置，接管重画后恢复；搜索词变化时不恢复（结果从头看）
            const scrollEls = [block, block.closest('.drawer-content')].filter(Boolean);
            let lastScroll = null;
            let scrollToRestore = null;
            let lastSearch = $('#persona_search_bar').val() || '';
            const saveScroll = () => {
                // 面板隐藏时读到的 scrollTop 恒为 0，不能记
                if (scrollToRestore || !block.getClientRects().length) return;
                lastScroll = scrollEls.map(el => el.scrollTop);
            };
            saveScroll();
            for (const el of scrollEls) el.addEventListener('scroll', saveScroll, { passive: true });
            // 兜底：面板重新显示时位置若有变化不一定触发 scroll 事件，点击时补记一次
            document.addEventListener('pointerdown', saveScroll, true);

            new MutationObserver(() => {
                if (isOwnRender) return;
                if (personaDragState) return;
                // 此时 ST 已重画完，但 scroll 事件尚未派发，lastScroll 仍是重画前的位置
                if (!scrollToRestore) scrollToRestore = lastScroll;
                handlePendingDuplication();
                handlePendingCreationTags();
                clearTimeout(takeoverDebounce);
                takeoverDebounce = setTimeout(async () => {
                    // 在替换 ST 的卡片之前，读取 ST 标记的选中状态
                    const stSelected = block.querySelector('.avatar-container.selected');
                    if (stSelected) {
                        const id = stSelected.getAttribute('data-avatar-id');
                        if (id) currentPersonaAvatar = id;
                    }
                    // 检测 ST 是否渲染了缓存中没有的新人设（刚创建/导入的）
                    if (serverAvatarSet) {
                        const stCards = block.querySelectorAll('.avatar-container[data-avatar-id]');
                        let hasNew = false;
                        for (const card of stCards) {
                            const id = card.getAttribute('data-avatar-id');
                            if (id && !serverAvatarSet.has(id)) { hasNew = true; break; }
                        }
                        if (hasNew) await refreshServerAvatars();
                    }
                    applyFiltersAndRender();
                    renderFilterArea();
                    updateViewModeInfo();
                    if (currentPersonaAvatar) renderTagEditor(currentPersonaAvatar);
                    const search = $('#persona_search_bar').val() || '';
                    if (scrollToRestore && search === lastSearch) {
                        scrollEls.forEach((el, i) => { el.scrollTop = scrollToRestore[i]; });
                    }
                    lastSearch = search;
                    scrollToRestore = null;
                }, 50);
            }).observe(block, { childList: true });
        }

        // MutationObserver：绑定关系列表变化时刷新筛选区高亮
        let connectionDebounceTimer = null;
        const connList = document.getElementById('persona_connections_list');
        if (connList) {
            new MutationObserver(() => {
                if (connectionDebounceTimer) clearTimeout(connectionDebounceTimer);
                connectionDebounceTimer = setTimeout(() => {
                    renderFilterArea();
                    updateViewModeInfo();
                }, 200);
            }).observe(connList, { childList: true, subtree: true });
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
                purgeOrphanedEntries();
                applyFiltersAndRender();
                renderFilterArea();
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
                purgeOrphanedEntries();
                if (!$('#persona-tags-editor-section').length) {
                    injectTagEditor();
                }
                if (!$('#persona-tags-view-mode').length) {
                    injectViewModeToggle();
                }
                if (!$('#persona-quick-scroll').length) {
                    injectQuickScrollControls();
                }
                renderFilterArea();
                updateViewModeInfo();
                // 同步批量模式按钮状态
                $('.persona-batch-mode-btn').toggleClass('active', batchMode);
                const cur = detectCurrentPersona();
                if (cur) renderTagEditor(cur);
                applyFiltersAndRender();
                if (batchMode) renderBatchToolbar();
            }, 300);
        });

        console.log(LOG, 'Initialized!');
    }

    await init();
});
