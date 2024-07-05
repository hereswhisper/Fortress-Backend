function createEquippedTemplate(Variant, ItemDefinition, MCPVariantData, res) {
    return {
        Variant: Variant,
        MCPVariantData: MCPVariantData,
        ItemDefinition: ItemDefinition
    };
}

module.exports = {
    createEquippedTemplate
}