package com.edscorp.eds.user.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.edscorp.eds.user.entity.UserEntity;
import com.edscorp.eds.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    @Autowired
    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    public boolean authenticate(String id, String rawPassword) {
        Optional<UserEntity> user = userRepository.findById(id);
        return user.isPresent() && passwordEncoder.matches(rawPassword, user.get().getPw());
    }

    public List<UserEntity> getAllUsers() {
        return userRepository.findAll();
    }
}
