type KYCStatus =
  | 'not_started'
  | 'incomplete'
  | 'awaiting_questionnaire'
  | 'awaiting_ubo'
  | 'awaiting_review'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'paused'
  | 'offboarded';

type TOSStatus = 'pending' | 'approved';

export interface KYCDto {
  id: string;
  full_name: string;
  email: string;
  type: 'individual' | 'business';
  kyc_link: string;
  tos_link: string;
  kyc_status: KYCStatus;
  tos_status: TOSStatus;
}

export type KYCListDto = {
  count: number;
  data: KYCDto[];
};
