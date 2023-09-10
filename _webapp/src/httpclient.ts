import axios from 'axios'

const HEADER_KEY_TOTAL_COUNT = 'x-total-count'
interface Response<T> {
  code: number
  error: string
  payload: T
  total: number | undefined
  status: string
}

interface Base {
  id: number
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date
}

export interface Account extends Base {
  username: string
  token: string
}

export interface Station extends Base {
  name?: string
  lat?: number
  lng?: number
  altitude?: number
}

export enum SensorPosition {
  up = 'up',
  middle = 'middle',
  down = 'down'
}

export interface Sensor extends Base {
  station_id: number
  position?: SensorPosition
  tag?: string
  name?: string
  group?: string
  unit?: string
}

export interface DataRecord extends Base {
  sensor_id: number
  value?: number
  time?: Date
}

export const getPositionName = (position: SensorPosition | undefined): string => {
  if (position) {
    switch (position) {
      case SensorPosition.up:
        return '板外点'
      case SensorPosition.middle:
        return '板间点'
      case SensorPosition.down:
        return '板下点'
    }
  }
  return ''
}

export const getSensorDisplayText = (sensor: Sensor, stationName?: string): string => {
  let displayText = ''
  if (stationName) {
    displayText += `${stationName}: `
  }
  if (sensor.position) {
    displayText += `${getPositionName(sensor.position)}-`
  }
  if (sensor.group) {
    displayText += `${sensor.group}-`
  }
  if (sensor.name) {
    displayText += sensor.name
  }
  if (sensor.tag) {
    displayText += `(${sensor.tag})`
  }
  return displayText
}

class HttpClient {
  public baseUrl: string = (function (): string {
    if (import.meta.env.VITE_API_ENDPOINT) return import.meta.env.VITE_API_ENDPOINT
    return import.meta.env.DEV
      ? 'http://localhost:8080/api'
      : 'https://tuc-env-monitoring-dashboard.vercel.app/api'
  })()

  private _token: string = ''

  public get token(): string {
    if (this._token) return this._token
    const token = localStorage.getItem('token')
    if (token) this.token = token
    return this._token
  }

  public set token(token: string) {
    this._token = token
    localStorage.setItem('token', token)
  }

  public absoluteUrl(url: string): string {
    if (url.startsWith('/')) {
      return this.baseUrl + url
    }
    return url
  }

  private _headers(): { [key: string]: string } {
    const headers: { [key: string]: string } = {}
    if (this._token) {
      headers['Authorization'] = `${this._token}`
    }
    return headers
  }

  // base
  private async get<T>(url: string): Promise<Response<T> | null> {
    url = this.absoluteUrl(url)
    try {
      const resp = await axios.get<Response<T>>(url, { headers: this._headers() })
      const count = resp.headers[HEADER_KEY_TOTAL_COUNT]
      console.log(JSON.stringify(resp.headers))
      return {
        ...resp.data,
        total: count ? parseInt(count) : undefined
      }
    } catch (err: any) {
      return err?.response.data
    }
  }

  private async post<T>(url: string, data: any = null): Promise<Response<T> | null> {
    url = this.absoluteUrl(url)
    try {
      const resp = await axios.post<Response<T>>(url, data, { headers: this._headers() })
      return resp?.data
    } catch (err: any) {
      return err?.response.data
    }
  }

  private async put<T>(url: string, data: any = null): Promise<Response<T> | null> {
    url = this.absoluteUrl(url)
    try {
      const resp = await axios.put<Response<T>>(url, data, { headers: this._headers() })
      return resp?.data
    } catch (err: any) {
      return err?.response.data
    }
  }

  private async delete<T>(url: string): Promise<Response<T> | null> {
    url = this.absoluteUrl(url)
    try {
      const resp = await axios.delete<Response<T>>(url, { headers: this._headers() })
      return resp?.data
    } catch (err: any) {
      return err?.response.data
    }
  }

  // auth

  public isAuthorized(): boolean {
    if (!this.token) return false
    return true
  }

  public async register(
    username: string,
    password: string
  ): Promise<Response<{ token: string }> | null> {
    const resp = await this.post<{ token: string }>('/register', { username, password: password })
    if (resp?.code === 200) {
      alert('Registration successful. Please login to continue.')
    }
    return resp
  }

  public async login(
    username: string,
    password: string
  ): Promise<Response<{ token: string }> | null> {
    const resp = await this.post<{ token: string }>('/login', { username, password: password })
    if (resp?.code === 200) {
      resp.payload.token && (this.token = resp.payload.token)
    }
    return resp
  }

  public async logout() {
    this.token = ''
  }

  public async getAccount(): Promise<Response<Account> | null> {
    const resp = await this.get<Account>('/account')
    return resp
  }

  public async regenrateToken(): Promise<Response<Account> | null> {
    const resp = await this.post<Account>('/account/regenrateToken')
    if (resp?.payload.token) {
      this.token = resp?.payload.token
    }
    return resp
  }

  public async changePassword(newPassword: string): Promise<Response<Account> | null> {
    const resp = await this.post<Account>('/account/changePassword', { new_password: newPassword })
    return resp
  }

  // stations

  public async getStations(params?: {
    offset?: number
    limit?: number
  }): Promise<Response<Station[]> | null> {
    const ret = []
    if (params?.offset) {
      ret.push(`offset=${params.offset}`)
    }
    if (params?.limit) {
      ret.push(`limit=${params.limit}`)
    }
    const resp = await this.get<Station[]>(`/stations?${ret.join('&')}`)
    return resp
  }

  public async upsertStation(params: {
    name: string
    lat: number
    lng: number
    altitude: number
  }): Promise<Response<Station> | null> {
    const resp = await this.post<Station>('/stations', params)
    return resp
  }

  // sensors

  public async getSensors(params?: {
    stationID?: number
    offset?: number
    limit?: number
  }): Promise<Response<Sensor[]> | null> {
    const ret = []
    if (params?.offset) {
      ret.push(`offset=${params.offset}`)
    }
    if (params?.limit) {
      ret.push(`limit=${params.limit}`)
    }
    if (params?.stationID) {
      ret.push(`station_id=${params.stationID}`)
    }
    const resp = await this.get<Sensor[]>(`/sensors?${ret.join('&')}`)
    return resp
  }

  public async upsertSensor(sensor: Sensor): Promise<Response<Sensor> | null> {
    const resp = await this.post<Sensor>('/sensors', sensor)
    return resp
  }

  // records

  public async downloadTemplate(): Promise<string | null> {
    const url = this.absoluteUrl('/records/template')
    const resp = await axios.get<string>(url, { headers: this._headers() })
    return resp.data
  }

  public async uploadCSVRecords(data: any): Promise<Response<any> | null> {
    const resp = await this.post<any>('/records/upload', data)
    return resp
  }

  public async getRecords(params?: {
    sensorIDs?: number[]
    startTime?: Date
    endTime?: Date
    beforeCreatedAt?: Date
    afterCreatedAt?: Date
    offset?: number
    limit?: number
  }): Promise<Response<DataRecord[]> | null> {
    const ret = []
    if (params?.sensorIDs) {
      const str = params?.sensorIDs.map((sensorID) => sensorID.toString()).join(',')
      ret.push('sensor_ids=' + encodeURIComponent(str))
    }
    if (params?.startTime) {
      ret.push('start_time=' + encodeURIComponent(params.startTime.toISOString()))
    }
    if (params?.endTime) {
      ret.push('end_time=' + encodeURIComponent(params.endTime.toISOString()))
    }
    if (params?.beforeCreatedAt) {
      ret.push('before_created_at=' + encodeURIComponent(params.beforeCreatedAt.toISOString()))
    }
    if (params?.afterCreatedAt) {
      ret.push('after_created_at=' + encodeURIComponent(params.afterCreatedAt.toISOString()))
    }
    if (params?.offset) {
      ret.push(`offset=${params.offset}`)
    }
    if (params?.limit) {
      ret.push(`limit=${params.limit}`)
    }
    const resp = await this.get<DataRecord[]>(`/records?${ret.join('&')}`)
    return resp
  }
}

export default new HttpClient()
