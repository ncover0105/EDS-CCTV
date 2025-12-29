package com.edscorp.eds.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edscorp.eds.user.dto.UserSmsDisableBatchRequest;
import com.edscorp.eds.user.dto.UserSmsUpdateRequest;
import com.edscorp.eds.user.entity.UserEntity;
import com.edscorp.eds.user.service.UserSmsService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users/sms")
public class UserSmsController {

    private final UserSmsService userSmsService;

    @PatchMapping("/{id}")
    public ResponseEntity<UserEntity> updateSmsSetting(
            @PathVariable("id") String id,
            @RequestBody UserSmsUpdateRequest req) {
        return ResponseEntity.ok(userSmsService.updateSmsSetting(id, req));
    }

    @PostMapping("/disable-batch")
    public ResponseEntity<Void> disableBatch(@RequestBody UserSmsDisableBatchRequest req) {
        userSmsService.disableBatch(req.getUserIds());
        return ResponseEntity.ok().build();
    }
}
