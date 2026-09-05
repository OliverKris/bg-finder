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
  game!: string;

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

  // The user who created the session. Many sessions can belong to one owner.
  // eager: true means the owner is automatically loaded whenever a Session
  // is fetched, without needing to remember to add a relations: ['owner'].
  @ManyToOne(() => User, { eager: true, onDelete: "CASCADE" })
  owner!: User;

  // Users who have joined. @JoinTable() must go on exactly one side of a
  // many-to-many relation — this creates a session_participants_user join
  // table under the hood.
  @ManyToMany(() => User, { eager: true })
  @JoinTable({ name: "session_participants" })
  participants!: User[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
