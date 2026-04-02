export interface Module {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  has_access?: boolean;
}

export interface Tool {
  id: string;
  module_id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  route: string | null;
  sort_order: number;
  has_access?: boolean;
}

export interface UserPermissions {
  modules: Module[];
  tools: Tool[];
}

export interface ModuleWithTools extends Module {
  tools: Tool[];
}
