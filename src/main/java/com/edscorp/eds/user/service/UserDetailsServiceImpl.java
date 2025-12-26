package com.edscorp.eds.user.service;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.edscorp.eds.user.entity.UserEntity;
import com.edscorp.eds.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String id) throws UsernameNotFoundException {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + id));

        String role = (user.getRole() == null || user.getRole().isBlank())
                ? "USER"
                : user.getRole().trim();

        return User.withUsername(user.getId())
                .password(user.getPw())
                .roles(role)
                .build();
    }

    // @Override
    // public UserDetails loadUserByUsername(String id) throws
    // UsernameNotFoundException {
    // System.out.println("UserDetails id : " + id);
    // BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    // String encodedPassword = encoder.encode("123");
    // System.out.println("UserDetails encodedPassword : " + encodedPassword);
    // com.edscorp.eds.user.entity.UserEntity user = userRepository.findById(id)
    // .orElseThrow(() -> new UsernameNotFoundException("User not found: " + id));
    // System.out.println("UserDetails pw : " + user.getPw());

    // return User.withUsername(user.getId())
    // .password(user.getPw())
    // .roles("USER")
    // .build();
    // }
}
