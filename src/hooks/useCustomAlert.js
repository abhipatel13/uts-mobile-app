import { useState } from 'react';

export const useCustomAlert = () => {
  const [alertState, setAlertState] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    type: 'info',
    showCloseButton: true,
  });

  const showAlert = ({
    title,
    message,
    buttons = [],
    type = 'info',
    showCloseButton = true,
  }) => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons,
      type,
      showCloseButton,
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({
      ...prev,
      visible: false,
    }));
  };

  // Convenience methods for common alert types
  const showSuccessAlert = (title, message, buttons = []) => {
    showAlert({
      title,
      message,
      buttons: buttons.length > 0 ? buttons : [{ text: 'OK', primary: true }],
      type: 'success',
    });
  };

  const showErrorAlert = (title, message, buttons = []) => {
    showAlert({
      title,
      message,
      buttons: buttons.length > 0 ? buttons : [{ text: 'OK', primary: true }],
      type: 'error',
    });
  };

  const showWarningAlert = (title, message, buttons = []) => {
    showAlert({
      title,
      message,
      buttons: buttons.length > 0 ? buttons : [{ text: 'OK', primary: true }],
      type: 'warning',
    });
  };

  const showConfirmAlert = (title, message, onConfirm, onCancel) => {
    showAlert({
      title,
      message,
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: 'Confirm',
          primary: true,
          onPress: onConfirm,
        },
      ],
      type: 'warning',
    });
  };

  return {
    alertState,
    showAlert,
    hideAlert,
    showSuccessAlert,
    showErrorAlert,
    showWarningAlert,
    showConfirmAlert,
  };
};
