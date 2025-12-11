export interface User {
  user_id: number;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  no_telp: string;
  username: string;
  password: string;
  role: 'admin' | 'regular';
  created_at: string;
}

export interface Shipment {
  id: number;
  user_id: number;
  nama_lengkap: string;
  nama_freelance?: string;
  tanggal: string;
  shipment_id: string;
  jumlah_toko: number;
  terkirim: number;
  gagal: number;
  alasan?: string;
  
  // Freelance fields
  dana_awal?: number;
  rute?: 'Luar Kota' | 'Dalam Kota';
  fee_harian?: number;
  bbm?: number;
  makan?: number;
  parkir?: number;
  tol?: number;
  grand_total?: number;
  
  created_at: string;
  updated_at: string;
}

export interface CardboardData {
  hk: number;
  hke: number;
  hkne: number;
}

export interface ChartData {
  date: string;
  terkirim: number;
  gagal: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}