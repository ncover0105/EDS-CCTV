// package com.edscorp.eds.interceptor;

// import org.slf4j.Logger;
// import org.slf4j.LoggerFactory;
// import org.springframework.stereotype.Component;
// import org.springframework.web.servlet.ModelAndView;
// import org.springframework.web.servlet.HandlerInterceptor;

// import jakarta.servlet.http.HttpServletRequest;
// import jakarta.servlet.http.HttpServletResponse;

// @Component
// public class SessionInterceptor implements HandlerInterceptor {

// 	private static final Logger logger = LoggerFactory.getLogger(SessionInterceptor.class);

// 	@Override
// 	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
// 		try {
// 			System.out.println(request.getRequestURI());
// 			System.out.println(request.getContextPath());
// //			String uRl = "/rain"; // 로그인 없이

// 			String uRl = "/LOGIN_VIEW"; // 로그인 페이지
// 			boolean ajax = request.getHeader("X-Requested-With") != null ? true : false; // ajax 요청 여부 체크

// 			 // 세션정보가 없을경우  false
// 			if(request.getSession().getAttribute("LoginInfo") == null){
// 				if (ajax) {
// 					response.setContentType("application/json; charset=UTF-8");
// 					response.getWriter().append("{\"sess\":false}");
// 				} else {
// 					String getURL=request.getRequestURI();
// 					if(getURL.contains("notifications"))
// 					{
// 						return true;
// 					}
// 					else
// 					{
// 						response.sendRedirect(request.getContextPath()+uRl);
// 					}
// 				}
// 				return false;
// 			}
// 			// 세션정보가 있고 root 접속시
// 			if(request.getRequestURI().equals("/")) {
// 				response.sendRedirect(request.getContextPath()+uRl);
// 				return false;
// 			}
// 		} catch (Exception e) {
// 			e.printStackTrace();
// 		}
// 		return true;
// 	}

// 	@Override
// 	public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
// 			if (request.getRequestURI().contains("CONTENTView")) {
// 				// handle CONTENTView logic here
// 			} 
// 	}

// 	@Override
// 	public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
// 		HandlerInterceptor.super.afterCompletion(request, response, handler, ex);
// 	}
// }