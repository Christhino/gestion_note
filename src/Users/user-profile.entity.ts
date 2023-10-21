import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
  } from 'typeorm';
  import { Niveau } from './niveau.entity';
  import { User } from './users.entity';
import { UEEntity } from 'src/unite_enseignement/unite-enseignement.entity';
import { Matiers } from 'src/unite_enseignement/matiers.entity';

  
  enum Gender {
    homme = 'M',
    femme = 'F',
  }
  
  @Entity()
  export class UserProfile {
    constructor(partial?: Partial<UserProfile>) {
      Object.assign(this, partial);
    }
  
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({
      unique: true,
    })
    company_person_id: number;
  
    @Column({
      type: 'varchar',
      length: 50,
    })
    firstname: string;
  
    @Column({
      type: 'varchar',
      length: 50,
    })
    lastname: string;
  
    @Column({
      type: 'varchar',
      length: 20,
      nullable: true,
    })
    mobile: string;
  
    @Column({
      type: 'varchar',
      length: 20,
      nullable: true,
    })
    phone: string;
  
    @Column({
      type: 'varchar',
      name: 'filiere',
      length: 50,
      nullable: true,
    })
    filiere?: string;
  
    @Column({
      type: 'enum',
      enum: Gender,
    })
    gender: Gender;
  
    @ManyToOne(() => Niveau, (niveau) => niveau.users)
    niveau: Niveau;
  
    @Column({ nullable: true })
    updatedAt?: Date;
  
    @Column({ nullable: true })
    fromDate?: Date;
  
    @Column({ nullable: true })
    toDate?: Date;
  
    @OneToOne(() => User, (user) => user.profile)
    user: User;
  
  
    @OneToMany(() => UEEntity, (ueentity) => ueentity.user)
    ueentity: UEEntity[];
  
    @OneToMany(() => Matiers, (matiers) => matiers.owner)
    matiers: Matiers[];
  }
  