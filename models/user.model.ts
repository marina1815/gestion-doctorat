export type UserRole = "ADMIN" | "CHEFDEPARTEMENT" | "CFD" | "CELLULE_ANONYMAT" | "CORRECTEUR" | "RESPONSABLE_SALLE";

export interface User {
  id: string;
  username: string;
  password: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}
