export interface BaseDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export interface PromptDialogOptions extends BaseDialogOptions {
  placeholder?: string;
  defaultValue?: string;
}

export type DialogRequest =
  | (BaseDialogOptions & { kind: 'alert'; resolve: () => void })
  | (BaseDialogOptions & { kind: 'confirm'; resolve: (value: boolean) => void })
  | (PromptDialogOptions & { kind: 'prompt'; resolve: (value: string | null) => void });

let openDialog: ((request: DialogRequest) => void) | null = null;

export function registerAppDialog(handler: (request: DialogRequest) => void) {
  openDialog = handler;
  return () => {
    if (openDialog === handler) openDialog = null;
  };
}

export function appAlert(message: string, title = '提示') {
  return new Promise<void>((resolve) => {
    if (!openDialog) {
      window.alert(message);
      resolve();
      return;
    }
    openDialog({ kind: 'alert', title, message, confirmText: '知道了', resolve });
  });
}

export function appConfirm(options: BaseDialogOptions | string) {
  const config = typeof options === 'string' ? { message: options } : options;
  return new Promise<boolean>((resolve) => {
    if (!openDialog) {
      resolve(window.confirm(config.message));
      return;
    }
    openDialog({
      kind: 'confirm',
      title: config.title || '确认操作',
      message: config.message,
      confirmText: config.confirmText || '确定',
      cancelText: config.cancelText || '取消',
      danger: config.danger,
      resolve,
    });
  });
}

export function appPrompt(options: PromptDialogOptions) {
  return new Promise<string | null>((resolve) => {
    if (!openDialog) {
      resolve(window.prompt(options.message, options.defaultValue || ''));
      return;
    }
    openDialog({
      kind: 'prompt',
      title: options.title || '请输入',
      message: options.message,
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      placeholder: options.placeholder,
      defaultValue: options.defaultValue || '',
      resolve,
    });
  });
}
