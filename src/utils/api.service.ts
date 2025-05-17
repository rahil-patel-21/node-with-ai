// Imports
import axios from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiService {
  async post(url: string, body = {}, headers = {}) {
    const response = await axios.post(url, body, {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });
    return response.data ?? {};
  }
}
