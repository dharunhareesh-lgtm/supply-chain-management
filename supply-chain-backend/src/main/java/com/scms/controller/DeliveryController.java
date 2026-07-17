package com.scms.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.scms.entity.Delivery;
import com.scms.service.DeliveryService;

@RestController
@RequestMapping("/deliveries")
@CrossOrigin(origins = "*")
public class DeliveryController {

    @Autowired
    private DeliveryService deliveryService;

    @GetMapping
    public List<Delivery> getAllDeliveries() {
        return deliveryService.getAllDeliveries();
    }

    @GetMapping("/{id}")
    public Delivery getDeliveryById(@PathVariable int id) {
        return deliveryService.getDeliveryById(id);
    }

    @PostMapping
    public Delivery addDelivery(
            @RequestBody Delivery delivery) {

        return deliveryService.addDelivery(delivery);
    }

    @PutMapping
    public Delivery updateDelivery(
            @RequestBody Delivery delivery) {

        return deliveryService.updateDelivery(delivery);
    }

    @DeleteMapping("/{id}")
    public String deleteDelivery(
            @PathVariable int id) {

        deliveryService.deleteDelivery(id);

        return "Delivery Deleted Successfully";
    }
}