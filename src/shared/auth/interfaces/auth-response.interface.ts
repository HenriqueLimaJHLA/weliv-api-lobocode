// Removido import de PermissionType - não existe mais no schema

export interface IAuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  // user: {
  //   id: string;
  //   name: string;
  //   email: string;
  //   role: string;
  //   userPermissions?: PermissionType[];
  // };
}

export interface IRefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  userId: string;
}

export interface ILogoutResponse {
  message: string;
  success: boolean;
}

export interface IForgotPasswordResponse {
  message: string;
  success: boolean;
}

export interface IResetPasswordResponse {
  message: string;
  success: boolean;
}

export interface IRegisterResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}
