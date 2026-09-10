import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

export enum SessionRepeat {
  NONE = "none",
  WEEKLY = "weekly",
  BIWEEKLY = "biweekly",
}

@Entity("sessions")
export class Session {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  games!: string[];

  @Column({ nullable: true })
  description?: string;

  @Column()
  location!: string;

  @Column()
  startTime!: Date;

  @Column()
  maxPlayers!: number;

  @Column({ type: "enum", enum: SessionRepeat, default: SessionRepeat.NONE })
  repeats!: SessionRepeat;

  @ManyToOne(() => User, { eager: true, onDelete: "CASCADE" })
  owner!: User;

  @ManyToMany(() => User, { eager: true })
  @JoinTable({ name: "session_participants" })
  participants!: User[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
