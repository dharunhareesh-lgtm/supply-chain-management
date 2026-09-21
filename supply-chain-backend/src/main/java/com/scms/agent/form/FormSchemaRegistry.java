package com.scms.agent.form;

import com.scms.agent.ActionType;
import com.scms.entity.PackagingStandard;
import com.scms.service.ProductService;
import com.scms.repository.PackagingStandardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Registry holding schemas for all Agent WRITE actions.
 * Fetches dynamic enums and options directly from existing business logic and repositories.
 */
@Component
public class FormSchemaRegistry {

    @Autowired
    private ProductService productService;

    @Autowired
    private PackagingStandardRepository packagingStandardRepository;

    /**
     * Obtains the dynamic schema for a given action.
     * Enums/options are populated on-demand from existing database configurations.
     */
    public ActionFormSchema getSchema(ActionType actionType) {
        if (actionType == ActionType.CREATE_PRODUCT_LISTING) {
            return buildCreateProductSchema();
        }
        return null;
    }

    private ActionFormSchema buildCreateProductSchema() {
        List<FormFieldMetadata> fields = new ArrayList<>();

        // 1. Product / Crop Name
        FormFieldMetadata nameField = new FormFieldMetadata(
            "productName",
            "Product Name",
            "பொருளின் பெயர்",
            FieldType.TEXT,
            true
        );
        nameField.setHintEn("Enter the crop or produce name (e.g. Ponni Rice, Wheat, Moong Dal)");
        nameField.setHintTa("பயிர் அல்லது தானியத்தின் பெயரை உள்ளிடவும் (எ.கா: பொன்னி அரிசி, கோதுமை, பாசிப்பருப்பு)");
        fields.add(nameField);

        // 2. Category (Populated dynamically from existing ProductService.getAllowedCategories())
        FormFieldMetadata categoryField = new FormFieldMetadata(
            "category",
            "Category",
            "பொருள் வகை",
            FieldType.ENUM,
            true
        );
        List<String> allowedCategories = productService.getAllowedCategories();
        categoryField.setOptions(allowedCategories != null ? allowedCategories : Collections.emptyList());
        categoryField.setHintEn("Select from permitted agricultural commodity categories");
        categoryField.setHintTa("அனுமதிக்கப்பட்ட பயிர் வகைகளில் ஒன்றை தேர்ந்தெடுக்கவும்");
        fields.add(categoryField);

        // 3. Purchase Price / Base Cost
        FormFieldMetadata purchasePriceField = new FormFieldMetadata(
            "purchasePrice",
            "Base Purchase Price",
            "கொள்முதல் விலை",
            FieldType.NUMBER,
            true
        );
        purchasePriceField.setUnit("₹/kg");
        purchasePriceField.setMinValue(1.0);
        purchasePriceField.setHintEn("Cost price per kilogram in Rupees");
        purchasePriceField.setHintTa("ஒரு கிலோவுக்கான அடிப்படை கொள்முதல் விலை (ரூபாயில்)");
        fields.add(purchasePriceField);

        // 4. Pricing Strategy
        FormFieldMetadata strategyField = new FormFieldMetadata(
            "pricingStrategy",
            "Pricing Strategy",
            "விலை நிர்ணய உத்தி",
            FieldType.ENUM,
            true
        );
        strategyField.setOptions(List.of("PROFIT_PER_KG", "PROFIT_PERCENTAGE"));
        strategyField.setHintEn("Profit strategy (per KG fixed margin or percentage markup)");
        strategyField.setHintTa("லாப முறை (கிலோவிற்கு நிலையான லாபம் அல்லது சதவீத லாபம்)");
        fields.add(strategyField);

        // 5. Margin Value
        FormFieldMetadata marginField = new FormFieldMetadata(
            "marginValue",
            "Profit Margin",
            "லாப வரம்பு",
            FieldType.NUMBER,
            true
        );
        marginField.setMinValue(0.0);
        marginField.setHintEn("Target profit margin value");
        marginField.setHintTa("விற்பனைக்கான லாப மதிப்பு");
        fields.add(marginField);

        // 6. Packaging Breakdown (Bag sizes and counts)
        FormFieldMetadata packageField = new FormFieldMetadata(
            "packageBreakdown",
            "Packaging Inventory",
            "சிப்பங்கள் / மூட்டை இருப்பு",
            FieldType.PACKAGE_BREAKDOWN,
            true
        );
        List<String> activeSizes = packagingStandardRepository.findAll().stream()
            .filter(PackagingStandard::isActive)
            .map(s -> String.valueOf(s.getSize()))
            .collect(Collectors.toList());
        packageField.setOptions(activeSizes.isEmpty() ? List.of("50", "25", "10") : activeSizes);
        packageField.setHintEn("Specify bags and sizes (e.g. 50kg bags: 20, 25kg bags: 10)");
        packageField.setHintTa("மூட்டைகள் மற்றும் எடையை குறிப்பிடவும் (எ.கா: 50 கிலோ மூட்டை 20)");
        fields.add(packageField);

        // 7. Warehouse Assignment
        FormFieldMetadata warehouseField = new FormFieldMetadata(
            "warehouseId",
            "Warehouse Hub",
            "சேமிப்புக் கிடங்கு",
            FieldType.ENTITY_REF,
            true
        );
        warehouseField.setHintEn("Nearest warehouse hub for crop storage (can be auto-assigned)");
        warehouseField.setHintTa("தானியத்தை சேமிக்க வேண்டிய கிடங்கு (தானாகவும் தேர்ந்தெடுக்கப்படும்)");
        fields.add(warehouseField);

        // 8. Land Record Origin
        FormFieldMetadata landField = new FormFieldMetadata(
            "landRecordId",
            "Farmland Origin",
            "விளைந்த நிலம் (சர்வே எண்)",
            FieldType.ENTITY_REF,
            true
        );
        landField.setHintEn("Verified land parcel where produce was cultivated");
        landField.setHintTa("பயிர் விளைந்த அங்கீகரிக்கப்பட்ட நிலத்தின் சர்வே பதிவு");
        fields.add(landField);

        return new ActionFormSchema(
            ActionType.CREATE_PRODUCT_LISTING,
            "Create Product Listing",
            "புதிய பொருள் பட்டியல் உருவாக்குதல்",
            fields
        );
    }
}
