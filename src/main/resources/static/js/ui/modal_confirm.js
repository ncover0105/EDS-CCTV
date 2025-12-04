window.ModalConfirm = (function () {

    let modal, label, message, btnConfirm;

    function init() {
        modal = new bootstrap.Modal(document.getElementById("confirm_modal"));
        label = document.getElementById("confirmModalLabel");
        message = document.getElementById("confirmModalMessage");
        btnConfirm = document.getElementById("confirmModalConfirmBtn");
    }

    function show(title, text, onConfirm) {
        if (!modal) init();

        label.textContent = title ?? "확인";
        message.textContent = text ?? "";

        const newBtn = btnConfirm.cloneNode(true);
        btnConfirm.replaceWith(newBtn);
        btnConfirm = newBtn;

        btnConfirm.onclick = () => {
            modal.hide();
            if (typeof onConfirm === "function") onConfirm();
        };

        modal.show();
    }

    return { show };

})();