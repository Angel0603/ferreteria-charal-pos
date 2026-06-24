export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categorias: {
        Row: {
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          activo: boolean
          created_at: string | null
          direccion: string | null
          email: string | null
          id: string
          limite_credito: number
          nombre: string
          notas: string | null
          rfc: string | null
          saldo_credito: number
          sucursal_id: string | null
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          limite_credito?: number
          nombre: string
          notas?: string | null
          rfc?: string | null
          saldo_credito?: number
          sucursal_id?: string | null
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          limite_credito?: number
          nombre?: string
          notas?: string | null
          rfc?: string | null
          saldo_credito?: number
          sucursal_id?: string | null
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario: {
        Row: {
          cantidad: number
          id: string
          producto_id: string
          sucursal_id: string
          updated_at: string | null
        }
        Insert: {
          cantidad?: number
          id?: string
          producto_id: string
          sucursal_id: string
          updated_at?: string | null
        }
        Update: {
          cantidad?: number
          id?: string
          producto_id?: string
          sucursal_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventario_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_inventario: {
        Row: {
          cantidad: number
          created_at: string | null
          id: string
          notas: string | null
          producto_id: string
          referencia: string | null
          sucursal_id: string
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          cantidad: number
          created_at?: string | null
          id?: string
          notas?: string | null
          producto_id: string
          referencia?: string | null
          sucursal_id: string
          tipo: string
          usuario_id?: string | null
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          id?: string
          notas?: string | null
          producto_id?: string
          referencia?: string | null
          sucursal_id?: string
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_inventario_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_inventario_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_inventario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          activo: boolean
          created_at: string | null
          id: string
          nombre: string
          rol: string
          sucursal_id: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string | null
          id: string
          nombre: string
          rol: string
          sucursal_id?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string | null
          id?: string
          nombre?: string
          rol?: string
          sucursal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          activo: boolean
          categoria_id: string | null
          codigo_barras: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          imagen_url: string | null
          nombre: string
          precio_base: number
          precio_mayoreo: number | null
          sku: string | null
          stock_minimo: number
          unidad: string
        }
        Insert: {
          activo?: boolean
          categoria_id?: string | null
          codigo_barras?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          nombre: string
          precio_base?: number
          precio_mayoreo?: number | null
          sku?: string | null
          stock_minimo?: number
          unidad?: string
        }
        Update: {
          activo?: boolean
          categoria_id?: string | null
          codigo_barras?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          nombre?: string
          precio_base?: number
          precio_mayoreo?: number | null
          sku?: string | null
          stock_minimo?: number
          unidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedores: {
        Row: {
          activo: boolean
          contacto: string | null
          created_at: string | null
          email: string | null
          id: string
          nombre: string
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          contacto?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nombre: string
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          contacto?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nombre?: string
          telefono?: string | null
        }
        Relationships: []
      }
      sucursales: {
        Row: {
          activa: boolean
          created_at: string | null
          direccion: string | null
          id: string
          nombre: string
          telefono: string | null
        }
        Insert: {
          activa?: boolean
          created_at?: string | null
          direccion?: string | null
          id?: string
          nombre: string
          telefono?: string | null
        }
        Update: {
          activa?: boolean
          created_at?: string | null
          direccion?: string | null
          id?: string
          nombre?: string
          telefono?: string | null
        }
        Relationships: []
      }
      venta_items: {
        Row: {
          cantidad: number
          created_at: string | null
          descuento: number
          id: string
          precio_unitario: number
          producto_id: string
          subtotal: number
          venta_id: string
        }
        Insert: {
          cantidad: number
          created_at?: string | null
          descuento?: number
          id?: string
          precio_unitario: number
          producto_id: string
          subtotal: number
          venta_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          descuento?: number
          id?: string
          precio_unitario?: number
          producto_id?: string
          subtotal?: number
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venta_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venta_items_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      ventas: {
        Row: {
          cajero_id: string
          cliente_id: string | null
          created_at: string | null
          descuento: number
          estado: string
          folio: string
          id: string
          metodo_pago: string
          notas: string | null
          subtotal: number
          sucursal_id: string
          total: number
        }
        Insert: {
          cajero_id: string
          cliente_id?: string | null
          created_at?: string | null
          descuento?: number
          estado?: string
          folio: string
          id?: string
          metodo_pago: string
          notas?: string | null
          subtotal?: number
          sucursal_id: string
          total?: number
        }
        Update: {
          cajero_id?: string
          cliente_id?: string | null
          created_at?: string | null
          descuento?: number
          estado?: string
          folio?: string
          id?: string
          metodo_pago?: string
          notas?: string | null
          subtotal?: number
          sucursal_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "ventas_cajero_id_fkey"
            columns: ["cajero_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      descontar_inventario: {
        Args: {
          p_cantidad: number
          p_producto_id: string
          p_sucursal_id: string
        }
        Returns: undefined
      }
      generar_folio: { Args: { p_sucursal_id: string }; Returns: string }
      mi_rol: { Args: never; Returns: string }
      mi_sucursal: { Args: never; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
