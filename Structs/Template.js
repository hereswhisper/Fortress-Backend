function createTemplate(templateId, UnlockedStyles, res) {
    return {
        TemplateId: templateId,
        Favorite: false,
        UnlockedStyles: UnlockedStyles,
    };
}

module.exports = {
    createTemplate
}