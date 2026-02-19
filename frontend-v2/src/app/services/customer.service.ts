import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc, Timestamp, getDoc } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Customer, CustomerFormData } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  
  async getAll(): Promise<Customer[]> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('Not authenticated');
    
    const customersRef = collection(this.firestore, 'customers');
    const q = query(
      customersRef,
      where('createdBy', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.mapDocToCustomer(doc));
  }
  
  async getById(id: string): Promise<Customer | null> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('Not authenticated');
    
    const docRef = doc(this.firestore, 'customers', id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    
    const data = snapshot.data();
    // Verify ownership
    if (data['createdBy'] !== user.uid) {
      throw new Error('Unauthorized');
    }
    
    return this.mapDocToCustomer(snapshot);
  }
  
  async search(searchTerm: string): Promise<Customer[]> {
    const customers = await this.getAll();
    if (!searchTerm || searchTerm.trim() === '') return customers;
    
    const term = searchTerm.toLowerCase().trim();
    return customers.filter(c =>
      c.firstName?.toLowerCase().includes(term) ||
      c.lastName?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.address?.toLowerCase().includes(term) ||
      c.idNumber?.includes(term)
    );
  }
  
  async create(customerData: CustomerFormData & { formattedAddress?: string; latitude?: number; longitude?: number }): Promise<Customer> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('Not authenticated');
    
    const customersRef = collection(this.firestore, 'customers');
    const now = Timestamp.now();
    
    const newCustomer = {
      idNumber: customerData.idNumber,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      email: customerData.email,
      phone: customerData.phone || null,
      address: customerData.address,
      formattedAddress: customerData.formattedAddress || null,
      latitude: customerData.latitude || null,
      longitude: customerData.longitude || null,
      createdBy: user.uid,
      createdAt: now,
      updatedAt: now
    };
    
    const docRef = await addDoc(customersRef, newCustomer);
    
    return {
      id: docRef.id,
      ...newCustomer,
      createdAt: now.toDate(),
      updatedAt: now.toDate()
    } as Customer;
  }
  
  async update(id: string, data: Partial<CustomerFormData> & { formattedAddress?: string; latitude?: number; longitude?: number }): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('Not authenticated');
    
    // Verify ownership first
    const existing = await this.getById(id);
    if (!existing) throw new Error('Customer not found');
    
    const docRef = doc(this.firestore, 'customers', id);
    const updateData: any = {
      updatedAt: Timestamp.now()
    };
    
    // Only update provided fields
    if (data.idNumber !== undefined) updateData.idNumber = data.idNumber;
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.formattedAddress !== undefined) updateData.formattedAddress = data.formattedAddress || null;
    if (data.latitude !== undefined) updateData.latitude = data.latitude || null;
    if (data.longitude !== undefined) updateData.longitude = data.longitude || null;
    
    await updateDoc(docRef, updateData);
  }
  
  async delete(id: string): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('Not authenticated');
    
    // Verify ownership first
    const existing = await this.getById(id);
    if (!existing) throw new Error('Customer not found');
    
    const docRef = doc(this.firestore, 'customers', id);
    await deleteDoc(docRef);
  }
  
  private mapDocToCustomer(doc: any): Customer {
    const data = doc.data();
    return {
      id: doc.id,
      idNumber: data.idNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      formattedAddress: data.formattedAddress,
      latitude: data.latitude,
      longitude: data.longitude,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    };
  }
}
