<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
  <!-- Main Sidebar Container -->
  <aside class="main-sidebar sidebar-dark-primary elevation-4">
    <!-- Brand Logo -->
    <a href="#" onClick='reset()' class="brand-link" style="background:#262626; padding: 0.7rem 0.5rem;">
    <img src="/login/img/ELOGO.png" alt="AdminLTE Logo" style="margin-left: 0.8rem;line-height: .8;margin-top: -3px;max-height: 33px;width: auto;">
    <span class="brand-text font-weight-normal" style="margin-left: -0.5rem;">
      <img src="/login/img/DSLOGO.png" alt="AdminLTE Logo" class="brand-text" style="margin-left: 0;line-height: .8;margin-top: -3px;max-height: 33px;width: auto;">
      <img src="/login/img/STRLOGO.png" alt="AdminLTE Logo" class="brand-text" style="margin-left: -0.3rem;max-height: 1rem;width: auto; vertical-align: bottom;"></span>
    </a>

    <!-- Sidebar -->
    <div class="sidebar">
      <!-- Sidebar user panel (optional) -->
      <div class="user-panel mb-2 mt-2 d-flex" style="padding: 0.5rem 0;text-align: center; background-color: rgb(255, 255, 255);border-radius: 0.25rem;">
        <div class="image col-3"style="margin:auto;padding:0.8rem 0.8rem ">
          <img  class="img-circle elevation-2 " alt="User Image"id="userFace" style="height: 2.1rem;" onerror="this.src='/login/img/usersolid.jpg'">
        </div>
        <div class="info col-9">
          <div class="info-box-content">
            <b style="float: left;">${LoginInfo.busiNm}<br/>${LoginInfo.empNm} / ${LoginInfo.respDiviNm}</b>
          </div>
        </div>
      </div>
      <script>
        var corpCd = "${LoginInfo.corpCd}";
        var saveNm = "${LoginInfo.saveNm}";
        var ext = "${LoginInfo.ext}";
        var param = corpCd+":"+saveNm+":"+ext;

        document.getElementById('userFace').setAttribute("src","/BASE_USER_MGT_LIST/selectUserFaceImage/" + param);
      </script>

      <!-- SidebarSearch Form -->
      <div class="form-inline">
        <div class="input-group" data-widget="sidebar-search">
          <input class="form-control form-control-sidebar" type="search" placeholder="Search" aria-label="Search">
          <div class="input-group-append">
            <button class="btn btn-sidebar">
              <i class="fas fa-search fa-fw"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Sidebar Menu -->
      <nav class="mt-2">
        <ul class="nav nav-pills nav-sidebar flex-column nav-compact nav-child-indent nav-collapse-hide-child" data-widget="treeview" role="menu" data-accordion="false"id="menulist">
        </ul>
      </nav>
      <!-- /.sidebar-menu -->
    </div>
    <!-- /.sidebar -->
</aside>