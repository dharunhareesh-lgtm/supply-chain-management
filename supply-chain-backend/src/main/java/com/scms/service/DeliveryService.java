package com.scms.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.scms.entity.Delivery;
import com.scms.repository.DeliveryRepository;

@Service
public class DeliveryService {

    @Autowired
    private DeliveryRepository deliveryRepository;

    public List<Delivery> getAllDeliveries() {
        return deliveryRepository.findAll();
    }

    public Delivery getDeliveryById(int id) {
        return deliveryRepository.findById(id).orElse(null);
    }

    public Delivery addDelivery(Delivery delivery) {
        return deliveryRepository.save(delivery);
    }

    public Delivery updateDelivery(Delivery delivery) {
        return deliveryRepository.save(delivery);
    }

    public void deleteDelivery(int id) {
        deliveryRepository.deleteById(id);
    }
}