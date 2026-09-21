package com.scms.agent;

/**
 * Encapsulates pending write actions (such as UPDATE_PRODUCT_STOCK or UPDATE_PRODUCT_PRICE)
 * awaiting explicit farmer confirmation.
 */
public class PendingProductUpdate {
    private final ActionType actionType;
    private final Integer productId;
    private final String productName;
    private final Double oldPrice;
    private final Double newPrice;
    private final Integer oldStock;
    private final Integer newStock;
    private final String language;

    public PendingProductUpdate(ActionType actionType, Integer productId, String productName,
                                Double oldPrice, Double newPrice,
                                Integer oldStock, Integer newStock,
                                String language) {
        this.actionType = actionType;
        this.productId = productId;
        this.productName = productName;
        this.oldPrice = oldPrice;
        this.newPrice = newPrice;
        this.oldStock = oldStock;
        this.newStock = newStock;
        this.language = language;
    }

    public ActionType getActionType() {
        return actionType;
    }

    public Integer getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public Double getOldPrice() {
        return oldPrice;
    }

    public Double getNewPrice() {
        return newPrice;
    }

    public Integer getOldStock() {
        return oldStock;
    }

    public Integer getNewStock() {
        return newStock;
    }

    public String getLanguage() {
        return language;
    }
}
