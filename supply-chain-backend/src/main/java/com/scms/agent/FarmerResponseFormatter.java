package com.scms.agent;

import java.util.*;
import org.springframework.stereotype.Component;

/**
 * Natural language response formatter for Tamil and English.
 * Formats structured API results into clean, empathetic, farmer-centric responses.
 */
@Component
public class FarmerResponseFormatter {

    public String formatGreeting(String language, String farmerName) {
        String name = (farmerName != null && !farmerName.isBlank()) ? farmerName : "விவசாயி";
        if ("ta".equals(language)) {
            return "வணக்கம் " + name + "! நான் உங்கள் திராவிக்ஸ் விவசாய உதவியாளர் (DRAVIX Farmer Agent). " +
                   "பொருட்கள், வருமானம், சந்தை விலை அல்லது பயிர் முன்னறிவிப்பு பற்றி என்னிடம் கேளுங்கள்.";
        } else {
            String engName = (farmerName != null && !farmerName.isBlank()) ? farmerName : "Farmer";
            return "Hello " + engName + "! I am your DRAVIX Farmer Assistant. " +
                   "Ask me about your products, revenue, mandi prices, or future price forecasts.";
        }
    }

    public String formatHelp(String language) {
        if ("ta".equals(language)) {
            return "நான் செய்யக்கூடிய சில உதவிகள்:\n" +
                   "• 'என்னோட products காட்டு' (பொருட்கள் இருப்பு)\n" +
                   "• 'எவ்வளவு revenue வந்திருக்கு?' (வருமானம் & நிலுவை)\n" +
                   "• 'தக்காளி விலை என்ன?' (மண்டி நேரலை விலை)\n" +
                   "• 'நெல் விலை forecast சொல்லு' (7-60 நாள் விலை கணிப்பு)\n" +
                   "• 'காப்பீடு விவரங்கள்' (க்ளைம் ஸ்டேட்டஸ்)\n" +
                   "• 'Forecast பக்கம் open பண்ணு' (பக்கங்களுக்கு செல்ல)";
        } else {
            return "Here are things you can ask me:\n" +
                   "• 'Show my products' (check catalog & stock)\n" +
                   "• 'What is my total revenue?' (earnings & balance)\n" +
                   "• 'Tomato price in Pollachi' (live mandi rates)\n" +
                   "• 'Rice price forecast' (7-60 day ML predictions)\n" +
                   "• 'Show my insurance claims' (claims status)\n" +
                   "• 'Go to market forecast' (page navigation)";
        }
    }

    public String formatProducts(String language, List<?> products) {
        int count = products != null ? products.size() : 0;
        if (count == 0) {
            return "ta".equals(language)
                ? "தற்போது உங்களிடம் பட்டியலிடப்பட்ட பொருட்கள் எதுவும் இல்லை. புதிய பொருளை சேர்க்க 'Add Product' என கூறலாம்."
                : "You currently have no products listed. Say 'Add product' if you want to create a listing.";
        }

        StringBuilder sb = new StringBuilder();
        if ("ta".equals(language)) {
            sb.append("உங்களிடம் மொத்தம் ").append(count).append(" பொருட்கள் பட்டியலிடப்பட்டுள்ளன:\n");
        } else {
            sb.append("You currently have ").append(count).append(" products listed:\n");
        }

        int limit = Math.min(count, 5);
        for (int i = 0; i < limit; i++) {
            Object obj = products.get(i);
            if (obj instanceof com.scms.entity.Product p) {
                sb.append("• ").append(p.getProductName())
                  .append(" — ₹").append(Math.round(p.getPrice())).append("/kg")
                  .append(" (இருப்பு: ").append(p.getStock()).append(" kg)\n");
            }
        }
        if (count > 5) {
            sb.append("ta".equals(language) ? "...மேலும் விவரங்களுக்கு Products பக்கத்தை பாருங்கள்." : "...view full catalog on Products page.");
        }
        return sb.toString().trim();
    }

    public String formatFinancialSummary(String language, Map<String, Object> summary) {
        if (summary == null || summary.isEmpty()) {
            return "ta".equals(language)
                ? "வருமான விவரங்களை தற்போது பெற முடியவில்லை."
                : "Unable to retrieve revenue summary at this time.";
        }

        double netEarnings = getDouble(summary.get("netEarnings"));
        double totalRevenue = getDouble(summary.get("totalRevenue"));
        double pendingSettlement = getDouble(summary.get("pendingSettlement"));
        long delivered = getLong(summary.get("totalOrdersDelivered"));

        if ("ta".equals(language)) {
            return String.format(
                "உங்கள் வருமான விவரங்கள்:\n" +
                "• நிகர வருமானம் (Net Earnings): ₹%,.2f\n" +
                "• மொத்த விற்பனை (Gross Revenue): ₹%,.2f\n" +
                "• நிலுவையில் உள்ள தொகை (Pending): ₹%,.2f\n" +
                "• வெற்றிகரமாக டெலிவரி ஆன ஆர்டர்கள்: %d",
                netEarnings, totalRevenue, pendingSettlement, delivered
            );
        } else {
            return String.format(
                "Your financial summary:\n" +
                "• Net Earnings: ₹%,.2f\n" +
                "• Gross Revenue: ₹%,.2f\n" +
                "• Pending Settlement: ₹%,.2f\n" +
                "• Delivered Orders: %d",
                netEarnings, totalRevenue, pendingSettlement, delivered
            );
        }
    }

    public String formatMandiPrice(String language, String crop, String market, Object obsObj) {
        if (obsObj == null) {
            return "ta".equals(language)
                ? market + " மண்டியில் " + crop + " க்கான அரசு விலை விவரங்கள் தற்போது கிடைக்கவில்லை."
                : "Government mandi price data is currently unavailable for " + crop + " in " + market + ".";
        }

        if (obsObj instanceof com.scms.entity.GovMarketObservation obs) {
            double modal = obs.getModalPrice();
            double min = obs.getMinPrice();
            double max = obs.getMaxPrice();
            double modalKg = modal > 250.0 ? modal / 100.0 : modal;

            java.time.LocalDate obsDate = obs.getMarketDate();
            String formattedDate = obsDate != null
                ? obsDate.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : "N/A";

            String variety = (obs.getVariety() != null && !obs.getVariety().trim().isEmpty() && !obs.getVariety().equalsIgnoreCase("Other"))
                ? " [" + obs.getVariety() + "]"
                : "";

            // Calculate freshness: if older than 2 days, show notice
            boolean isStale = false;
            long daysAgo = 0;
            if (obsDate != null) {
                daysAgo = java.time.temporal.ChronoUnit.DAYS.between(obsDate, java.time.LocalDate.now());
                if (daysAgo > 2) {
                    isStale = true;
                }
            }

            if ("ta".equals(language)) {
                StringBuilder sb = new StringBuilder();
                sb.append(String.format(
                    "%s (%s) மண்டி நிலவரம் (%s%s):\n" +
                    "• சராசரி விலை: ₹%.1f/kg (₹%,.0f/குவிண்டால்)\n" +
                    "• குறைந்தபட்சம்: ₹%,.0f/குவிண்டால் | அதிகபட்சம்: ₹%,.0f/குவிண்டால்\n" +
                    "• பதிவு தேதி: %s",
                    obs.getMarket(), obs.getDistrict(), obs.getCommodity(), variety,
                    modalKg, modal, min, max, formattedDate
                ));
                if (isStale) {
                    sb.append(String.format(" (%d நாட்களுக்கு முந்தைய நிலவரம்)", daysAgo));
                }
                return sb.toString();
            } else {
                StringBuilder sb = new StringBuilder();
                sb.append(String.format(
                    "%s (%s) Mandi Rate for %s%s:\n" +
                    "• Modal Price: ₹%.1f/kg (₹%,.0f/quintal)\n" +
                    "• Min: ₹%,.0f/quintal | Max: ₹%,.0f/quintal\n" +
                    "• Observation Date: %s",
                    obs.getMarket(), obs.getDistrict(), obs.getCommodity(), variety,
                    modalKg, modal, min, max, formattedDate
                ));
                if (isStale) {
                    sb.append(String.format(" (Recorded %d days ago)", daysAgo));
                }
                return sb.toString();
            }
        }
        return obsObj.toString();
    }

    public String formatForecast(String language, com.scms.dto.ForecastResponse forecast) {
        if (forecast == null || forecast.getError() != null 
                || "INSUFFICIENT_HISTORICAL_DATA".equals(forecast.getForecastStatus())
                || forecast.getPredicted7Days() == null) {
            return "ta".equals(language)
                ? "இந்த பயிருக்கு விலை கணிப்பு உருவாக்க போதுமான வரலாற்றுத் தரவுகள் இல்லை. மேலும் சந்தைத் தரவு சேகரிக்கப்பட்ட பிறகு கணிப்பு கிடைக்கும்."
                : "Not enough historical market data is available to generate a price forecast for this crop. The forecast will become available as more market data is collected.";
        }

        double p7 = forecast.getPredicted7Days();
        double p15 = forecast.getPredicted15Days() != null ? forecast.getPredicted15Days() : p7;
        double p30 = forecast.getPredicted30Days() != null ? forecast.getPredicted30Days() : p15;
        String trend = forecast.getTrend() != null ? forecast.getTrend() : "STABLE";

        if ("ta".equals(language)) {
            String trendTa = "UPWARD".equalsIgnoreCase(trend) ? "உயரும் (ஏற்றம்)" : "DOWNWARD".equalsIgnoreCase(trend) ? "குறையும் (இறக்கம்)" : "நிலையானது";
            return String.format(
                "AI விலை முன்னறிவிப்பு (%s):\n" +
                "• அடுத்த 7 நாட்களில்: ₹%.1f/kg\n" +
                "• அடுத்த 15 நாட்களில்: ₹%.1f/kg\n" +
                "• அடுத்த 30 நாட்களில்: ₹%.1f/kg\n" +
                "• சந்தை போக்கு: %s",
                forecast.getProductName(), p7, p15, p30, trendTa
            );
        } else {
            return String.format(
                "AI Price Forecast for %s:\n" +
                "• 7 Days: ₹%.1f/kg\n" +
                "• 15 Days: ₹%.1f/kg\n" +
                "• 30 Days: ₹%.1f/kg\n" +
                "• Market Trend: %s",
                forecast.getProductName(), p7, p15, p30, trend
            );
        }
    }

    public String formatUnknown(String language) {
        return "ta".equals(language)
            ? "மன்னிக்கவும், தங்களால் கேட்கப்பட்ட விவரம் தெளிவாக புரியவில்லை. 'உதவி' அல்லது 'help' என கூறி என்னென்ன செய்ய முடியும் என்று பாருங்கள்."
            : "Sorry, I didn't quite understand that command. Type 'help' to see what actions I can perform for you.";
    }

    public String formatStockUpdateConfirmation(String language, String productName, int oldStock, int newStock) {
        if ("ta".equals(language)) {
            return String.format(
                "உங்கள் '%s' இருப்பை %d kg-லிருந்து %d kg-ஆக மாற்ற விரும்புகிறீர்களா?\nஉறுதிப்படுத்த 'சரி' அல்லது 'confirm' என கூறவும். ரத்து செய்ய 'வேண்டாம்' அல்லது 'cancel' என கூறவும்.",
                productName, oldStock, newStock
            );
        } else {
            return String.format(
                "Are you sure you want to update the stock for '%s' from %d kg to %d kg?\nReply 'confirm' or 'yes' to proceed, or 'cancel' to abort.",
                productName, oldStock, newStock
            );
        }
    }

    public String formatPriceUpdateConfirmation(String language, String productName, double oldPrice, double newPrice) {
        if ("ta".equals(language)) {
            return String.format(
                "உங்கள் '%s' கொள்முதல் விலையை ₹%.1f/kg-லிருந்து ₹%.1f/kg-ஆக மாற்ற விரும்புகிறீர்களா?\nஉறுதிப்படுத்த 'சரி' அல்லது 'confirm' என கூறவும். ரத்து செய்ய 'வேண்டாம்' அல்லது 'cancel' என கூறவும்.",
                productName, oldPrice, newPrice
            );
        } else {
            return String.format(
                "Are you sure you want to update the base price for '%s' from ₹%.1f/kg to ₹%.1f/kg?\nReply 'confirm' or 'yes' to proceed, or 'cancel' to abort.",
                productName, oldPrice, newPrice
            );
        }
    }

    public String formatStockUpdateSuccess(String language, String productName, int newStock) {
        if ("ta".equals(language)) {
            return String.format("'%s' பொருளின் இருப்பு வெற்றிகரமாக %d kg-ஆக மாற்றப்பட்டது.", productName, newStock);
        } else {
            return String.format("Successfully updated stock for '%s' to %d kg.", productName, newStock);
        }
    }

    public String formatPriceUpdateSuccess(String language, String productName, double newPrice, double newSellingPrice) {
        if ("ta".equals(language)) {
            return String.format("'%s' பொருளின் கொள்முதல் விலை ₹%.1f/kg-ஆகவும், விற்பனை விலை ₹%.1f/kg-ஆகவும் வெற்றிகரமாக மாற்றப்பட்டது.",
                productName, newPrice, newSellingPrice);
        } else {
            return String.format("Successfully updated price for '%s' (Base: ₹%.1f/kg, Selling: ₹%.1f/kg).",
                productName, newPrice, newSellingPrice);
        }
    }

    public String formatUpdateCancelled(String language) {
        if ("ta".equals(language)) {
            return "மாற்றம் ரத்து செய்யப்பட்டது. வேறு ஏதேனும் உதவி வேண்டுமா?";
        } else {
            return "Update cancelled. Let me know if you need anything else.";
        }
    }

    private double getDouble(Object val) {
        if (val instanceof Number n) return n.doubleValue();
        return 0.0;
    }

    private long getLong(Object val) {
        if (val instanceof Number n) return n.longValue();
        return 0L;
    }
}
