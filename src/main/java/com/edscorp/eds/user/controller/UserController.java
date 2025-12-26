package com.edscorp.eds.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edscorp.eds.user.dto.SignupRequest;
import com.edscorp.eds.user.dto.UserCreateRequest;
import com.edscorp.eds.user.dto.UserRoleUpdateRequest;
import com.edscorp.eds.user.dto.UserUpdateRequest;
import com.edscorp.eds.user.entity.UserEntity;
import com.edscorp.eds.user.repository.UserRepository;
import com.edscorp.eds.user.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;
    private final UserRepository userRepository;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest req) {
        userService.signup(req);
        return ResponseEntity.ok().build();
    }

    @PostMapping
    public UserEntity create(@RequestBody UserCreateRequest req) {
        return userService.create(req);
    }

    @GetMapping("/{id}")
    public UserEntity get(@PathVariable String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    // ✅ 비번/전화만 수정 (로그인 사용자 정책은 SecurityConfig에서 제어)
    @PutMapping("/{id}")
    public UserEntity updateBasic(@PathVariable String id, @RequestBody UserUpdateRequest req) {
        return userService.updateBasic(id, req);
    }

    // ✅ 권한 변경은 관리자만
    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('MANAGER')")
    public UserEntity updateRole(@PathVariable String id, @RequestBody UserRoleUpdateRequest req) {
        return userService.updateRole(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        // 택1
        // userService.deleteHard(id);
        userService.disableSoft(id);
    }
}
