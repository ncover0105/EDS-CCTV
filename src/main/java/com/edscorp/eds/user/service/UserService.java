package com.edscorp.eds.user.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.edscorp.eds.user.dto.SignupRequest;
import com.edscorp.eds.user.dto.UserCreateRequest;
import com.edscorp.eds.user.dto.UserRoleUpdateRequest;
import com.edscorp.eds.user.dto.UserUpdateRequest;
import com.edscorp.eds.user.entity.UserEntity;
import com.edscorp.eds.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    @Autowired
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public void signup(SignupRequest req) {

        if (req.getId() == null || req.getId().isBlank())
            throw new IllegalArgumentException("ID는 필수입니다.");

        if (req.getPw() == null || req.getPw().isBlank())
            throw new IllegalArgumentException("비밀번호는 필수입니다.");

        if (!req.getPw().equals(req.getPwConfirm()))
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");

        String id = req.getId().trim();

        if (userRepository.existsById(id))
            throw new IllegalArgumentException("이미 존재하는 ID입니다.");

        UserEntity user = new UserEntity();
        user.setId(id);
        user.setPw(passwordEncoder.encode(req.getPw())); // ✅ BCrypt
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPhnNo(req.getPhnNo());

        // 🔒 기본 정책
        user.setRole("USER");
        user.setAlertEnabledYn("Y");
        user.setEventAlertYn("N");
        user.setWarnAlertYn("N");

        user.setInpDttm(LocalDateTime.now());

        userRepository.save(user);
    }

    public boolean authenticate(String id, String rawPassword) {
        Optional<UserEntity> user = userRepository.findById(id);
        return user.isPresent() && passwordEncoder.matches(rawPassword, user.get().getPw());
    }

    public List<UserEntity> getAllUsers() {
        return userRepository.findAll();
    }

    public UserEntity create(UserCreateRequest req) {
        if (req.getId() == null || req.getId().isBlank())
            throw new IllegalArgumentException("id required");
        if (req.getPw() == null || req.getPw().isBlank())
            throw new IllegalArgumentException("pw required");

        if (userRepository.existsById(req.getId())) {
            throw new IllegalArgumentException("duplicated id");
        }

        UserEntity user = new UserEntity();
        user.setId(req.getId());
        user.setPw(passwordEncoder.encode(req.getPw()));
        user.setPhnNo(req.getPhnNo());
        user.setRole((req.getUserRole() == null || req.getUserRole().isBlank()) ? "USER" : req.getUserRole());

        // 삭제 대신 비활성 쓰는 경우 기본값
        if (user.getAlertEnabledYn() == null)
            user.setAlertEnabledYn("Y");

        return userRepository.save(user);
    }

    public UserEntity get(String id) {
        return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public UserEntity updateBasic(String id, UserUpdateRequest req) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setPhnNo(req.getPhnNo());
        return userRepository.save(user);
    }

    public UserEntity updateRole(String id, UserRoleUpdateRequest req) {
        UserEntity user = get(id);
        String role = (req.getUserRole() == null || req.getUserRole().isBlank()) ? "USER" : req.getUserRole();
        user.setRole(role);
        return userRepository.save(user);
    }

    public void deleteHard(String id) {
        userRepository.deleteById(id);
    }

    public void disableSoft(String id) {
        UserEntity user = get(id);
        user.setAlertEnabledYn("N");
        userRepository.save(user);
    }

}
