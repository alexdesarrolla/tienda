// Tienda App - Main JavaScript File with Supabase Integration

// Initialize Supabase Client
const supabaseUrl = 'https://utpiwcqedxgvtiemkwtx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cGl3Y3FlZHhndnRpZW1rd3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1NDA3MDMsImV4cCI6MjA1NjExNjcwM30.S2mvJCYV0hU8juVh4g-sl-IYPQQ1T3s6DJ6AjyauD0E';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Global Data Storage
const store = {
  // Current user session
  currentUser: null,
  
  // Store data
  productos: [],
  clientes: [],
  ventas: [],
  movimientosStock: [],
  notas: [],
  
  // Get next ID for a collection - Now used as fallback only
  getNextId: function(collection) {
    if (!collection || collection.length === 0) return 1;
    return Math.max(...collection.map(item => item.id)) + 1;
  },
  
  // Flag to track if data is currently being loaded
  isLoading: false,
  
  // Save session to localStorage
  saveSession: function() {
    localStorage.setItem('tiendaAppSession', JSON.stringify({
      currentUser: this.currentUser,
      timestamp: new Date().getTime()
    }));
  },
  
  // Load session from localStorage
  loadSession: function() {
    const sessionData = localStorage.getItem('tiendaAppSession');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        // Check if session is not too old (e.g., 7 days)
        const now = new Date().getTime();
        const sessionAge = now - session.timestamp;
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        
        if (sessionAge < maxAge) {
          this.currentUser = session.currentUser;
          return true;
        } else {
          // Session expired
          localStorage.removeItem('tiendaAppSession');
          return false;
        }
      } catch (e) {
        console.error('Error parsing session data:', e);
        return false;
      }
    }
    return false;
  },
  
  // Clear session
  clearSession: function() {
    localStorage.removeItem('tiendaAppSession');
    this.currentUser = null;
  }
};

// Loading indicator
const loadingManager = {
  show: function() {
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
      loadingElement.style.display = 'flex';
    }
  },
  
  hide: function() {
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }
};

// Data Management
const dataManager = {
  // Load all data from Supabase
  loadAllData: async function() {
    store.isLoading = true;
    loadingManager.show();
    
    try {
      await Promise.all([
        this.loadProductos(),
        this.loadClientes(),
        this.loadVentas(),
        this.loadMovimientosStock(),
        this.loadNotas()
      ]);
      
      console.log('All data loaded successfully');
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      alert('Error al cargar datos. Por favor, intenta nuevamente.');
    } finally {
      store.isLoading = false;
      loadingManager.hide();
    }
  },
  
  // Load Productos from Supabase
  loadProductos: async function() {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('nombre');
      
      if (error) throw error;
      
      store.productos = data || [];
      return store.productos;
    } catch (error) {
      console.error('Error loading productos:', error);
      throw error;
    }
  },
  
  // Load Clientes from Supabase
  loadClientes: async function() {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre');
      
      if (error) throw error;
      
      store.clientes = data || [];
      return store.clientes;
    } catch (error) {
      console.error('Error loading clientes:', error);
      throw error;
    }
  },
  
  // Load Ventas from Supabase
  loadVentas: async function() {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select('*')
        .order('fecha', { ascending: false });
      
      if (error) throw error;
      
      // Map database column names to our local store format
      store.ventas = (data || []).map(venta => ({
        ...venta,
        clienteId: venta.cliente_id,
        productoId: venta.producto_id
      }));
      
      return store.ventas;
    } catch (error) {
      console.error('Error loading ventas:', error);
      throw error;
    }
  },
  
  // Load Movimientos de Stock from Supabase
  loadMovimientosStock: async function() {
    try {
      const { data, error } = await supabase
        .from('movimientos_stock')
        .select('*')
        .order('fecha', { ascending: false });
      
      if (error) throw error;
      
      // Map database column names to our local store format
      store.movimientosStock = (data || []).map(movimiento => ({
        ...movimiento,
        productoId: movimiento.producto_id
      }));
      
      return store.movimientosStock;
    } catch (error) {
      console.error('Error loading movimientos de stock:', error);
      throw error;
    }
  },
  
  // Load Notas from Supabase
  loadNotas: async function() {
    try {
      const { data, error } = await supabase
        .from('notas')
        .select('*')
        .order('fecha', { ascending: false });
      
      if (error) throw error;
      
      store.notas = data || [];
      return store.notas;
    } catch (error) {
      console.error('Error loading notas:', error);
      throw error;
    }
  },
  
  // Subscribe to realtime changes
  setupRealtimeSubscription: function() {
    // Unsubscribe from any existing subscriptions first to prevent duplicates
    supabase.removeAllChannels();
    
    // Subscribe to productos changes
    supabase
      .channel('public:productos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, payload => {
        console.log('Productos change received:', payload);
        this.handleRealtimeChange('productos', payload);
      })
      .subscribe();
    
    // Subscribe to clientes changes
    supabase
      .channel('public:clientes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, payload => {
        console.log('Clientes change received:', payload);
        this.handleRealtimeChange('clientes', payload);
      })
      .subscribe();
    
    // Subscribe to ventas changes
    supabase
      .channel('public:ventas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, payload => {
        console.log('Ventas change received:', payload);
        
        // Map database column names to our local store format before processing
        if (payload.new) {
          payload.new = {
            ...payload.new,
            clienteId: payload.new.cliente_id,
            productoId: payload.new.producto_id
          };
        }
        
        this.handleRealtimeChange('ventas', payload);
      })
      .subscribe();
    
    // Subscribe to movimientos_stock changes
    supabase
      .channel('public:movimientos_stock')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movimientos_stock' }, payload => {
        console.log('Movimientos stock change received:', payload);
        
        // Map database column names to our local store format before processing
        if (payload.new) {
          payload.new = {
            ...payload.new,
            productoId: payload.new.producto_id
          };
        }
        
        this.handleRealtimeChange('movimientosStock', payload);
      })
      .subscribe();
    
    // Subscribe to notas changes
    supabase
      .channel('public:notas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notas' }, payload => {
        console.log('Notas change received:', payload);
        this.handleRealtimeChange('notas', payload);
      })
      .subscribe();
  },
  
  // Handle realtime changes to update UI
  handleRealtimeChange: function(collection, payload) {
    if (store.isLoading) return; // Ignore events during initial data load
    
    const event = payload.eventType;
    const newRecord = payload.new;
    const oldRecord = payload.old;
    
    // Handle different event types
    if (event === 'INSERT') {
      store[collection] = [...store[collection], newRecord];
    } else if (event === 'UPDATE') {
      store[collection] = store[collection].map(item => 
        item.id === newRecord.id ? newRecord : item
      );
    } else if (event === 'DELETE') {
      store[collection] = store[collection].filter(item => 
        item.id !== oldRecord.id
      );
    }
    
    // Update UI based on collection type
    switch (collection) {
      case 'productos':
        ui.displayProductos();
        break;
      case 'clientes':
        ui.displayClientes();
        break;
      case 'ventas':
        ui.displayVentas();
        ui.displayFiados();
        break;
      case 'movimientosStock':
        ui.displayStockMovimientos();
        break;
      case 'notas':
        ui.displayNotas();
        break;
    }
  }
};

// Authentication - updated to persist session
const auth = {
  login: function(username, password) {
    if (username === 'admin' && password === '1234') {
      store.currentUser = { username: 'admin', role: 'admin' };
      store.saveSession();
      return true;
    }
    return false;
  },
  
  logout: function() {
    store.clearSession();
    ui.showLoginScreen();
  },
  
  checkSession: function() {
    return store.loadSession();
  }
};

// Modal Manager - remains the same
const modalManager = {
  openModal: function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      // Add event listener to close modal when clicking outside the modal box
      const handleOutsideClick = (e) => {
        if (e.target === modal) {
          this.closeModal(modalId);
          modal.removeEventListener('click', handleOutsideClick);
        }
      };
      modal.addEventListener('click', handleOutsideClick);
    } else {
      console.error(`Modal with ID ${modalId} not found`);
    }
  },
  
  closeModal: function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  },
  
  closeAllModals: function() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.remove('active');
    });
  }
};

// Autocomplete component - remains the same
const autocomplete = {
  createAutocomplete: function(inputId, dataSource, displayProperty, valueProperty, onSelectCallback) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    // Create container and results div
    const container = document.createElement('div');
    container.className = 'autocomplete-container';
    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'autocomplete-results hidden';
    
    // Insert the new elements around the input
    input.parentNode.insertBefore(container, input);
    container.appendChild(input);
    container.appendChild(resultsDiv);
    
    // Store the selected item value
    let selectedValue = '';
    
    // Input event handlers
    input.addEventListener('input', function() {
      const searchText = this.value.toLowerCase().trim();
      if (searchText.length < 1) {
        resultsDiv.innerHTML = '';
        resultsDiv.classList.add('hidden');
        selectedValue = '';
        return;
      }
      
      // Get matches from the data source
      let matches;
      if (typeof dataSource === 'function') {
        matches = dataSource(searchText);
      } else {
        matches = dataSource.filter(item => 
          item[displayProperty].toLowerCase().includes(searchText)
        );
      }
      
      // Limit results
      matches = matches.slice(0, 10);
      
      // Clear previous results
      resultsDiv.innerHTML = '';
      
      if (matches.length > 0) {
        // Populate results
        matches.forEach(item => {
          const resultItem = document.createElement('div');
          resultItem.className = 'autocomplete-item';
          resultItem.textContent = item[displayProperty];
          resultItem.dataset.value = item[valueProperty];
          
          resultItem.addEventListener('click', function() {
            input.value = item[displayProperty];
            selectedValue = item[valueProperty];
            resultsDiv.classList.add('hidden');
            if (onSelectCallback) onSelectCallback(item);
          });
          
          resultsDiv.appendChild(resultItem);
        });
        
        resultsDiv.classList.remove('hidden');
      } else {
        resultsDiv.classList.add('hidden');
      }
    });
    
    // Handle keyboard navigation
    input.addEventListener('keydown', function(e) {
      if (resultsDiv.classList.contains('hidden')) return;
      
      const items = resultsDiv.querySelectorAll('.autocomplete-item');
      let selected = resultsDiv.querySelector('.selected');
      let index = -1;
      
      if (selected) {
        for (let i = 0; i < items.length; i++) {
          if (items[i] === selected) {
            index = i;
            break;
          }
        }
      }
      
      // Arrow down
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (selected) selected.classList.remove('selected');
        index = (index + 1) % items.length;
        items[index].classList.add('selected');
        items[index].scrollIntoView({ block: 'nearest' });
      }
      
      // Arrow up
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (selected) selected.classList.remove('selected');
        index = (index - 1 + items.length) % items.length;
        items[index].classList.add('selected');
        items[index].scrollIntoView({ block: 'nearest' });
      }
      
      // Enter
      else if (e.key === 'Enter' && selected) {
        e.preventDefault();
        input.value = selected.textContent;
        selectedValue = selected.dataset.value;
        resultsDiv.classList.add('hidden');
        if (onSelectCallback) onSelectCallback({
          [displayProperty]: selected.textContent,
          [valueProperty]: selected.dataset.value
        });
      }
      
      // Escape
      else if (e.key === 'Escape') {
        resultsDiv.classList.add('hidden');
      }
    });
    
    // Hide results when clicking outside
    document.addEventListener('click', function(e) {
      if (!container.contains(e.target)) {
        resultsDiv.classList.add('hidden');
      }
    });
    
    // Public methods
    return {
      getValue: function() {
        return selectedValue;
      },
      setValue: function(value, text) {
        selectedValue = value;
        input.value = text;
      },
      clear: function() {
        input.value = '';
        selectedValue = '';
        resultsDiv.innerHTML = '';
        resultsDiv.classList.add('hidden');
      }
    };
  }
};

// UI Manager - updated notas display
const ui = {
  // Autocomplete instances
  clienteAutocomplete: null,
  productoAutocomplete: null,
  editClienteAutocomplete: null,
  editProductoAutocomplete: null,
  
  // Show/hide sections
  showSection: function(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
    
    // Close drawer if open on mobile
    document.getElementById('drawer-toggle').checked = false;
  },
  
  showLoginScreen: function() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
  },
  
  showMainApp: async function() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    this.showSection('productos-section');
    
    // Load all data from Supabase
    await dataManager.loadAllData();
    
    // Initialize the data display for the first section
    this.displayProductos();
    
    // Setup realtime subscriptions
    dataManager.setupRealtimeSubscription();
    
    // Initialize autocomplete components
    this.initializeAutocompletes();
  },
  
  // Initialize autocompletes
  initializeAutocompletes: function() {
    // Client autocomplete for new sale
    this.clienteAutocomplete = autocomplete.createAutocomplete(
      'venta-cliente-input',
      store.clientes,
      'nombre',
      'id',
      null
    );
    
    // Product autocomplete for new sale
    this.productoAutocomplete = autocomplete.createAutocomplete(
      'venta-producto-input',
      store.productos,
      'nombre',
      'id',
      (item) => {
        // Optionally update quantity max or display stock info
        const producto = store.productos.find(p => p.id === parseInt(item.id));
        if (producto) {
          document.getElementById('venta-producto-stock').textContent = producto.stock;
          document.getElementById('venta-producto-stock-container').classList.remove('hidden');
        }
      }
    );
    
    // Client autocomplete for edit sale
    this.editClienteAutocomplete = autocomplete.createAutocomplete(
      'edit-venta-cliente-input',
      store.clientes,
      'nombre',
      'id',
      null
    );
    
    // Product autocomplete for edit sale
    this.editProductoAutocomplete = autocomplete.createAutocomplete(
      'edit-venta-producto-input',
      store.productos,
      'nombre',
      'id',
      (item) => {
        // Optionally update quantity max or display stock info
        const producto = store.productos.find(p => p.id === parseInt(item.id));
        if (producto) {
          document.getElementById('edit-venta-producto-stock').textContent = producto.stock;
          document.getElementById('edit-venta-producto-stock-container').classList.remove('hidden');
        }
      }
    );
  },
  
  // Tab management - remains the same
  showTab: function(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.add('hidden');
    });
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    
    // Update active tab
    document.querySelectorAll('.tabs .tab').forEach(tab => {
      tab.classList.remove('tab-active');
    });
    document.querySelector(`.tabs .tab[data-tab="${tabId}"]`).classList.add('tab-active');
  },
  
  // Populate select elements - remains the same
  populateProductoSelect: function(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccionar producto</option>';
    
    store.productos.forEach(producto => {
      const option = document.createElement('option');
      option.value = producto.id;
      option.textContent = `${producto.nombre} ($${producto.precio})`;
      select.appendChild(option);
    });
  },
  
  populateClienteSelect: function(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccionar cliente</option>';
    
    store.clientes.forEach(cliente => {
      const option = document.createElement('option');
      option.value = cliente.id;
      option.textContent = cliente.nombre;
      select.appendChild(option);
    });
  },
  
  // Search functionality - remains the same
  filterProductos: function(searchTerm) {
    searchTerm = searchTerm.toLowerCase().trim();
    const tbody = document.getElementById('productos-table-body');
    if (!tbody) return;
    
    const rows = tbody.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
      const productName = rows[i].getElementsByTagName('td')[0].textContent.toLowerCase();
      if (productName.includes(searchTerm)) {
        rows[i].style.display = '';
      } else {
        rows[i].style.display = 'none';
      }
    }
  },
  
  filterVentas: function(searchTerm) {
    searchTerm = searchTerm.toLowerCase().trim();
    const tbody = document.getElementById('ventas-table-body');
    if (!tbody) return;
    
    const rows = tbody.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
      const clienteName = rows[i].getElementsByTagName('td')[1].textContent.toLowerCase();
      const productName = rows[i].getElementsByTagName('td')[2].textContent.toLowerCase();
      if (clienteName.includes(searchTerm) || productName.includes(searchTerm)) {
        rows[i].style.display = '';
      } else {
        rows[i].style.display = 'none';
      }
    }
  },
  
  // Data display methods - unchanged but using Supabase data
  displayProductos: function() {
    const tbody = document.getElementById('productos-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    store.productos.forEach(producto => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${producto.nombre}</td>
        <td>$${parseFloat(producto.precio).toFixed(2)}</td>
        <td>${producto.stock}</td>
        <td>
          <button class="btn btn-sm btn-info edit-producto" data-id="${producto.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-error delete-producto" data-id="${producto.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    
    // Update selects with the new products
    this.populateProductoSelect('stock-producto-select');
    this.populateProductoSelect('venta-producto-select');
    this.populateProductoSelect('edit-venta-producto-select');
  },
  
  displayClientes: function() {
    const tbody = document.getElementById('clientes-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    store.clientes.forEach(cliente => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${cliente.id}</td>
        <td>${cliente.nombre}</td>
        <td>${cliente.detalles || '-'}</td>
        <td>
          <button class="btn btn-sm btn-info edit-cliente" data-id="${cliente.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-error delete-cliente" data-id="${cliente.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    
    // Update selects with the new clients
    this.populateClienteSelect('venta-cliente-select');
    this.populateClienteSelect('edit-venta-cliente-select');
    this.populateClienteSelect('fiado-cliente-select');
    this.populateClienteSelect('analisis-cliente-select');
  },
  
  displayStockMovimientos: function() {
    const tbody = document.getElementById('stock-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Sort by date, newest first (should already be sorted from Supabase)
    const movimientos = store.movimientosStock;
    
    movimientos.forEach(movimiento => {
      const producto = store.productos.find(p => p.id === movimiento.productoId);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(movimiento.fecha).toLocaleString()}</td>
        <td>${producto ? producto.nombre : 'Producto eliminado'}</td>
        <td>${movimiento.tipo === 'entrada' ? 
              '<span class="badge badge-success">Entrada</span>' : 
              '<span class="badge badge-warning">Salida</span>'}
        </td>
        <td>${movimiento.cantidad}</td>
      `;
      tbody.appendChild(tr);
    });
  },
  
  displayVentas: function() {
    const tbody = document.getElementById('ventas-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Sort by date, newest first (should already be sorted from Supabase)
    const ventas = store.ventas;
    
    ventas.forEach(venta => {
      const producto = store.productos.find(p => p.id === venta.productoId);
      const cliente = store.clientes.find(c => c.id === venta.clienteId);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(venta.fecha).toLocaleString()}</td>
        <td>${cliente ? cliente.nombre : 'Cliente eliminado'}</td>
        <td>${producto ? producto.nombre : 'Producto eliminado'}</td>
        <td>${venta.cantidad}</td>
        <td>$${parseFloat(venta.total).toFixed(2)}</td>
        <td>${venta.fiado ? 
          (venta.pagado ? '<span class="badge badge-success">Fiado Pagado</span>' : 
                         '<span class="badge badge-warning">Fiado Pendiente</span>') : 
          '<span class="badge badge-info">Contado</span>'}
        </td>
        <td>
          <button class="btn btn-sm btn-info edit-venta" data-id="${venta.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-error delete-venta" data-id="${venta.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },
  
  displayFiados: function() {
    const tbody = document.getElementById('fiados-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Get only fiado sales that are not fully paid
    const fiados = store.ventas.filter(v => v.fiado && !v.pagado);
    
    fiados.forEach(fiado => {
      const producto = store.productos.find(p => p.id === fiado.productoId);
      const cliente = store.clientes.find(c => c.id === fiado.clienteId);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${cliente ? cliente.nombre : 'Cliente eliminado'}</td>
        <td>${new Date(fiado.fecha).toLocaleString()}</td>
        <td>${producto ? producto.nombre : 'Producto eliminado'}</td>
        <td>${fiado.cantidad}</td>
        <td>$${parseFloat(fiado.total).toFixed(2)}</td>
        <td>${fiado.notas ? fiado.notas : '-'}</td>
        <td><span class="badge badge-warning">Pendiente</span></td>
        <td>
          <button class="btn btn-sm btn-success mark-fiado-paid" data-id="${fiado.id}">
            <i class="fas fa-check"></i> Marcar Pagado
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },
  
  displayNotas: function() {
    const notasContainer = document.getElementById('notas-container');
    if (!notasContainer) return;
    
    notasContainer.innerHTML = '';
    
    // Sort by date, newest first (should already be sorted from Supabase)
    const notas = store.notas;
    
    if (notas.length === 0) {
      // Show "no notes" message with improved styling
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'notes-empty-state';
      emptyMessage.innerHTML = `
        <i class="fas fa-sticky-note"></i>
        <h3>No hay notas guardadas</h3>
        <p>Crea tu primera nota para empezar a organizar tus ideas</p>
        <button class="btn btn-primary" id="empty-state-create-note-btn">
          <i class="fas fa-plus mr-2"></i> Crear Nota
        </button>
      `;
      notasContainer.appendChild(emptyMessage);
      
      // Add event listener to the button
      setTimeout(() => {
        const emptyStateBtn = document.getElementById('empty-state-create-note-btn');
        if (emptyStateBtn) {
          emptyStateBtn.addEventListener('click', function() {
            modalManager.openModal('add-nota-modal');
          });
        }
      }, 100);
      
      return;
    }
    
    // Create grid layout for notes
    const notesGrid = document.createElement('div');
    notesGrid.className = 'notes-grid'; // Using our custom grid class
    
    notas.forEach(nota => {
      const notaCard = document.createElement('div');
      notaCard.className = 'card note-card bg-base-100 shadow-xl';
      notaCard.innerHTML = `
        <div class="card-body">
          <div class="note-actions">
            <button class="btn btn-sm btn-info btn-note-action edit-nota" data-id="${nota.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-error btn-note-action delete-nota" data-id="${nota.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <h2 class="card-title">${nota.titulo}</h2>
          <div class="card-content whitespace-pre-line">${nota.contenido}</div>
          <div class="card-actions">
            <div class="note-date">
              <i class="fas fa-calendar-alt mr-1"></i>
              ${new Date(nota.fecha).toLocaleString()}
            </div>
          </div>
        </div>
      `;
      notesGrid.appendChild(notaCard);
    });
    
    notasContainer.appendChild(notesGrid);
  },
  
  // Analysis display methods - unchanged
  displayDailyAnalysis: function() {
    // Get today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const ventasHoy = store.ventas.filter(venta => {
      const ventaDate = new Date(venta.fecha);
      ventaDate.setHours(0, 0, 0, 0);
      return ventaDate.getTime() === today.getTime();
    });
    
    // Calculate totals
    const totalVentas = ventasHoy.length;
    const montoTotal = ventasHoy.reduce((total, venta) => total + parseFloat(venta.total), 0);
    const productosVendidos = ventasHoy.reduce((total, venta) => total + venta.cantidad, 0);
    
    // Update summary
    document.getElementById('total-ventas-dia').textContent = totalVentas;
    document.getElementById('monto-ventas-dia').textContent = montoTotal.toFixed(2);
    document.getElementById('productos-vendidos-dia').textContent = productosVendidos;
    
    // Display sales
    const tbody = document.getElementById('ventas-diarias-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Sort by time
    const ventasOrdenadas = [...ventasHoy].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    ventasOrdenadas.forEach(venta => {
      const producto = store.productos.find(p => p.id === venta.productoId);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(venta.fecha).toLocaleTimeString()}</td>
        <td>${producto ? producto.nombre : 'Producto eliminado'}</td>
        <td>${venta.cantidad}</td>
        <td>$${parseFloat(venta.total).toFixed(2)}</td>
        <td>${venta.notas || '-'}</td>
      `;
      tbody.appendChild(tr);
    });
  },
  
  displayWeeklyAnalysis: function() {
    // Get sales from the last 7 days
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);
    
    const ventasSemana = store.ventas.filter(venta => {
      const ventaDate = new Date(venta.fecha);
      return ventaDate >= weekAgo && ventaDate <= today;
    });
    
    // Calculate totals
    const totalVentas = ventasSemana.length;
    const montoTotal = ventasSemana.reduce((total, venta) => total + parseFloat(venta.total), 0);
    const productosVendidos = ventasSemana.reduce((total, venta) => total + venta.cantidad, 0);
    
    // Update summary
    document.getElementById('total-ventas-semana').textContent = totalVentas;
    document.getElementById('monto-ventas-semana').textContent = montoTotal.toFixed(2);
    document.getElementById('productos-vendidos-semana').textContent = productosVendidos;
    
    // Display daily breakdowns
    const tbody = document.getElementById('ventas-semanales-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Create daily summary
    const dailySummary = {};
    for (let i = 0; i <= 6; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      day.setHours(0, 0, 0, 0);
      
      dailySummary[day.toISOString().split('T')[0]] = {
        ventas: 0,
        monto: 0
      };
    }
    
    // Fill with data
    ventasSemana.forEach(venta => {
      const ventaDate = new Date(venta.fecha);
      ventaDate.setHours(0, 0, 0, 0);
      const dateKey = ventaDate.toISOString().split('T')[0];
      
      if (dailySummary[dateKey]) {
        dailySummary[dateKey].ventas += 1;
        dailySummary[dateKey].monto += parseFloat(venta.total);
      }
    });
    
    // Display in the table
    Object.entries(dailySummary)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .forEach(([fecha, data]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</td>
          <td>${data.ventas}</td>
          <td>$${data.monto.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
      });
  },
  
  displayMonthlyAnalysis: function() {
    // Get sales from the current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const ventasMes = store.ventas.filter(venta => {
      const ventaDate = new Date(venta.fecha);
      return ventaDate >= firstDay && ventaDate <= today;
    });
    
    // Calculate totals
    const totalVentas = ventasMes.length;
    const montoTotal = ventasMes.reduce((total, venta) => total + parseFloat(venta.total), 0);
    const productosVendidos = ventasMes.reduce((total, venta) => total + venta.cantidad, 0);
    
    // Update summary
    document.getElementById('total-ventas-mes').textContent = totalVentas;
    document.getElementById('monto-ventas-mes').textContent = montoTotal.toFixed(2);
    document.getElementById('productos-vendidos-mes').textContent = productosVendidos;
    
    // Display weekly breakdowns
    const tbody = document.getElementById('ventas-mensuales-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Create weekly summary
    const weeklySummary = {};
    let currentDate = new Date(firstDay);
    let weekNumber = 1;
    
    while (currentDate <= today) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      weeklySummary[weekNumber] = {
        start: new Date(weekStart),
        end: new Date(Math.min(weekEnd.getTime(), today.getTime())),
        ventas: 0,
        monto: 0
      };
      
      currentDate.setDate(currentDate.getDate() + 7);
      weekNumber++;
    }
    
    // Fill with data
    ventasMes.forEach(venta => {
      const ventaDate = new Date(venta.fecha);
      
      for (const [week, data] of Object.entries(weeklySummary)) {
        if (ventaDate >= data.start && ventaDate <= data.end) {
          data.ventas += 1;
          data.monto += parseFloat(venta.total);
          break;
        }
      }
    });
    
    // Display in the table
    Object.entries(weeklySummary).forEach(([week, data]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>Semana ${week} (${data.start.toLocaleDateString()} - ${data.end.toLocaleDateString()})</td>
        <td>${data.ventas}</td>
        <td>$${data.monto.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });
  },
  
  displayClientAnalysis: function(clientId) {
    const clienteContainer = document.getElementById('cliente-analisis-container');
    if (!clienteContainer) return;
    
    if (!clientId) {
      clienteContainer.classList.add('hidden');
      return;
    }
    
    clienteContainer.classList.remove('hidden');
    
    // Get client sales
    const ventasCliente = store.ventas.filter(venta => venta.clienteId === parseInt(clientId));
    
    // Calculate totals
    const totalCompras = ventasCliente.length;
    const montoTotal = ventasCliente.reduce((total, venta) => total + parseFloat(venta.total), 0);
    const saldoPendiente = ventasCliente
      .filter(venta => venta.fiado && !venta.pagado)
      .reduce((total, venta) => total + parseFloat(venta.total), 0);
    
    // Update summary
    document.getElementById('total-compras-cliente').textContent = totalCompras;
    document.getElementById('monto-total-cliente').textContent = montoTotal.toFixed(2);
    document.getElementById('saldo-pendiente-cliente').textContent = saldoPendiente.toFixed(2);
    
    // Display sales
    const tbody = document.getElementById('ventas-cliente-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Sort by date, newest first
    const ventasOrdenadas = [...ventasCliente].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    ventasOrdenadas.forEach(venta => {
      const producto = store.productos.find(p => p.id === venta.productoId);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(venta.fecha).toLocaleString()}</td>
        <td>${producto ? producto.nombre : 'Producto eliminado'}</td>
        <td>${venta.cantidad}</td>
        <td>$${parseFloat(venta.total).toFixed(2)}</td>
        <td>${venta.notas || '-'}</td>
        <td>${venta.fiado ? 
          (venta.pagado ? '<span class="badge badge-success">Fiado Pagado</span>' : '<span class="badge badge-warning">Fiado Pendiente</span>') : 
          '<span class="badge badge-info">Contado</span>'}
        </td>
      `;
      tbody.appendChild(tr);
    });
  },
  
  updateFiadoDetails: function(clientId) {
    const detallesContainer = document.getElementById('fiado-detalles');
    if (!detallesContainer) return;
    
    if (!clientId) {
      detallesContainer.classList.add('hidden');
      return;
    }
    
    // Calculate pending amount
    const montoPendiente = store.ventas
      .filter(venta => venta.clienteId === parseInt(clientId) && venta.fiado && !venta.pagado)
      .reduce((total, venta) => total + parseFloat(venta.total), 0);
    
    if (montoPendiente > 0) {
      document.getElementById('fiado-monto-pendiente').textContent = montoPendiente.toFixed(2);
      detallesContainer.classList.remove('hidden');
    } else {
      detallesContainer.classList.add('hidden');
    }
  },
  
  // Update UI based on fiado toggle
  updateFiadoStatus: function(isChecked) {
    const statusElement = document.getElementById('fiado-status');
    if (statusElement) {
      statusElement.textContent = isChecked ? 'Fiado' : 'Contado';
      statusElement.className = isChecked ? 'fiado-status text-warning' : 'fiado-status text-info';
    }
  },
  
  // For edit sale modals
  updateEditFiadoStatus: function(isChecked) {
    const statusElement = document.getElementById('edit-fiado-status');
    if (statusElement) {
      statusElement.textContent = isChecked ? 'Fiado' : 'Contado';
      statusElement.className = isChecked ? 'fiado-status text-warning' : 'fiado-status text-info';
    }
  }
};

// Business Logic - Updated to use Supabase
const productosManager = {
  agregarProducto: async function(nombre, precio, stock) {
    try {
      loadingManager.show();
      
      const newProducto = {
        nombre,
        precio: parseFloat(precio),
        stock: parseInt(stock)
      };
      
      // Insert product into Supabase
      const { data: producto, error } = await supabase
        .from('productos')
        .insert([newProducto])
        .select()
        .single();
      
      if (error) throw error;
      
      // Register stock movement
      await stockManager.registrarMovimiento(producto.id, 'entrada', producto.stock);
      
      // Add to local store (should be updated by subscription, but just in case)
      store.productos.push(producto);
      
      ui.displayProductos();
      return producto;
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error al agregar el producto: ' + error.message);
      return null;
    } finally {
      loadingManager.hide();
    }
  },
  
  editarProducto: async function(id, nombre, precio) {
    try {
      loadingManager.show();
      
      const updateData = {
        nombre,
        precio: parseFloat(precio)
      };
      
      // Update product in Supabase
      const { data, error } = await supabase
        .from('productos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update in local store (should be updated by subscription, but just in case)
      const index = store.productos.findIndex(p => p.id === id);
      if (index !== -1) {
        store.productos[index] = { ...store.productos[index], ...updateData };
      }
      
      ui.displayProductos();
      return true;
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error al actualizar el producto: ' + error.message);
      return false;
    } finally {
      loadingManager.hide();
    }
  },
  
  eliminarProducto: async function(id) {
    try {
      loadingManager.show();
      
      // Delete product from Supabase (cascade will delete related records)
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Remove from local store (should be updated by subscription, but just in case)
      store.productos = store.productos.filter(p => p.id !== id);
      
      ui.displayProductos();
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar el producto: ' + error.message);
      return false;
    } finally {
      loadingManager.hide();
    }
  }
};

const clientesManager = {
  agregarCliente: async function(nombre, detalles) {
    try {
      loadingManager.show();
      
      const newCliente = {
        nombre,
        detalles: detalles || ''
      };
      
      // Insert client into Supabase
      const { data: cliente, error } = await supabase
        .from('clientes')
        .insert([newCliente])
        .select()
        .single();
      
      if (error) throw error;
      
      // Add to local store (should be updated by subscription, but just in case)
      store.clientes.push(cliente);
      
      ui.displayClientes();
      return cliente;
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Error al agregar el cliente: ' + error.message);
      return null;
    } finally {
      loadingManager.hide();
    }
  },
  
  editarCliente: async function(id, nombre, detalles) {
    try {
      loadingManager.show();
      
      const updateData = {
        nombre,
        detalles: detalles || ''
      };
      
      // Update client in Supabase
      const { data, error } = await supabase
        .from('clientes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update in local store (should be updated by subscription, but just in case)
      const index = store.clientes.findIndex(c => c.id === id);
      if (index !== -1) {
        store.clientes[index] = { ...store.clientes[index], ...updateData };
      }
      
      ui.displayClientes();
      return true;
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Error al actualizar el cliente: ' + error.message);
      return false;
    } finally {
      loadingManager.hide();
    }
  },
  
  eliminarCliente: async function(id) {
    try {
      loadingManager.show();
      
      // Delete client from Supabase (cascade will delete related records)
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Remove from local store (should be updated by subscription, but just in case)
      store.clientes = store.clientes.filter(c => c.id !== id);
      
      ui.displayClientes();
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error al eliminar el cliente: ' + error.message);
      return false;
    } finally {
      loadingManager.hide();
    }
  }
};

const stockManager = {
  registrarMovimiento: async function(productoId, tipo, cantidad) {
    try {
      loadingManager.show();
      
      const newMovimiento = {
        producto_id: parseInt(productoId), // Changed from productoId to producto_id
        tipo,
        cantidad: parseInt(cantidad),
        fecha: new Date().toISOString()
      };
      
      // Insert stock movement into Supabase
      const { data: movimiento, error: movimientoError } = await supabase
        .from('movimientos_stock')
        .insert([newMovimiento])
        .select()
        .single();
      
      if (movimientoError) throw movimientoError;
      
      // Get current product
      const { data: producto, error: productoError } = await supabase
        .from('productos')
        .select('*')
        .eq('id', productoId)
        .single();
      
      if (productoError) throw productoError;
      
      // Update product stock
      let newStock = producto.stock;
      if (tipo === 'entrada') {
        newStock += parseInt(cantidad);
      } else if (tipo === 'salida') {
        newStock -= parseInt(cantidad);
      }
      
      // Update product in Supabase
      const { error: updateError } = await supabase
        .from('productos')
        .update({ stock: newStock })
        .eq('id', productoId);
      
      if (updateError) throw updateError;
      
      // Update in local store (should be updated by subscription, but just in case)
      const mappedMovimiento = {
        ...movimiento,
        productoId: movimiento.producto_id // Map back for local store consistency
      };
      store.movimientosStock.unshift(mappedMovimiento);
      
      const productoIndex = store.productos.findIndex(p => p.id === productoId);
      if (productoIndex !== -1) {
        store.productos[productoIndex].stock = newStock;
      }
      
      ui.displayStockMovimientos();
      ui.displayProductos();
      return mappedMovimiento;
    } catch (error) {
      console.error('Error registering stock movement:', error);
      alert('Error al registrar movimiento de stock: ' + error.message);
      return null;
    } finally {
      loadingManager.hide();
    }
  }
};

const ventasManager = {
  registrarVenta: async function(clienteId, productoId, cantidad, esFiado, notas) {
    try {
      loadingManager.show();
      
      // Get product to calculate total and check stock
      const { data: producto, error: productoError } = await supabase
        .from('productos')
        .select('*')
        .eq('id', parseInt(productoId))
        .single();
      
      if (productoError) throw productoError;
      
      if (producto.stock < parseInt(cantidad)) {
        return { success: false, error: 'Stock insuficiente' };
      }
      
      const newVenta = {
        cliente_id: parseInt(clienteId), // Changed from clienteId to cliente_id
        producto_id: parseInt(productoId), // Changed from productoId to producto_id
        cantidad: parseInt(cantidad),
        total: (parseInt(cantidad) * parseFloat(producto.precio)).toFixed(2),
        fecha: new Date().toISOString(),
        fiado: esFiado,
        pagado: !esFiado,
        notas: notas || ''
      };
      
      // Insert sale into Supabase
      const { data: venta, error: ventaError } = await supabase
        .from('ventas')
        .insert([newVenta])
        .select()
        .single();
      
      if (ventaError) throw ventaError;
      
      // Register stock movement
      await stockManager.registrarMovimiento(productoId, 'salida', cantidad);
      
      // Map the response back to our expected format for local store
      const mappedVenta = {
        ...venta,
        clienteId: venta.cliente_id, // Map back for local store consistency
        productoId: venta.producto_id // Map back for local store consistency
      };
      
      // Update in local store (should be updated by subscription, but just in case)
      store.ventas.unshift(mappedVenta);
      
      ui.displayVentas();
      ui.displayFiados();
      
      return { success: true, venta: mappedVenta };
    } catch (error) {
      console.error('Error registering sale:', error);
      alert('Error al registrar la venta: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      loadingManager.hide();
    }
  },
  
  editarVenta: async function(id, clienteId, productoId, cantidad, esFiado, notas) {
    try {
      loadingManager.show();
      
      // Get current sale
      const { data: venta, error: ventaError } = await supabase
        .from('ventas')
        .select('*')
        .eq('id', parseInt(id))
        .single();
      
      if (ventaError) throw ventaError;
      
      // Get product
      const { data: producto, error: productoError } = await supabase
        .from('productos')
        .select('*')
        .eq('id', parseInt(productoId))
        .single();
      
      if (productoError) throw productoError;
      
      // If the product is different or quantity increased, check stock
      if (venta.producto_id !== parseInt(productoId) || parseInt(cantidad) > venta.cantidad) {
        const cantidadAdicional = venta.producto_id !== parseInt(productoId) ? 
                                parseInt(cantidad) : 
                                parseInt(cantidad) - venta.cantidad;
        
        if (producto.stock < cantidadAdicional) {
          return { success: false, error: 'Stock insuficiente para la modificación' };
        }
        
        // If product changed, return the old product's stock
        if (venta.producto_id !== parseInt(productoId)) {
          // Get old product
          const { data: oldProducto, error: oldProductoError } = await supabase
            .from('productos')
            .select('*')
            .eq('id', venta.producto_id)
            .single();
          
          if (!oldProductoError && oldProducto) {
            // Return product to stock
            await stockManager.registrarMovimiento(venta.producto_id, 'entrada', venta.cantidad);
          }
          
          // Take new product from stock
          await stockManager.registrarMovimiento(productoId, 'salida', cantidad);
        } else if (parseInt(cantidad) > venta.cantidad) {
          // Just take more of the same product from stock
          await stockManager.registrarMovimiento(productoId, 'salida', parseInt(cantidad) - venta.cantidad);
        } else if (parseInt(cantidad) < venta.cantidad) {
          // Return some product to stock
          await stockManager.registrarMovimiento(productoId, 'entrada', venta.cantidad - parseInt(cantidad));
        }
      }
      
      // Update sale data
      const updateData = {
        cliente_id: parseInt(clienteId), // Changed from clienteId to cliente_id
        producto_id: parseInt(productoId), // Changed from productoId to producto_id
        cantidad: parseInt(cantidad),
        total: (parseInt(cantidad) * parseFloat(producto.precio)).toFixed(2),
        fiado: esFiado,
        notas: notas || '',
        pagado: venta.pagado || !esFiado // If was paid or now it's not fiado, mark as paid
      };
      
      // Update sale in Supabase
      const { data: updatedVenta, error: updateError } = await supabase
        .from('ventas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      // Map the response back to our expected format for local store
      const mappedVenta = {
        ...updatedVenta,
        clienteId: updatedVenta.cliente_id, // Map back for local store consistency
        productoId: updatedVenta.producto_id // Map back for local store consistency
      };
      
      // Update in local store (should be updated by subscription, but just in case)
      const index = store.ventas.findIndex(v => v.id === parseInt(id));
      if (index !== -1) {
        store.ventas[index] = mappedVenta;
      }
      
      ui.displayVentas();
      ui.displayFiados();
      
      return { success: true, venta: mappedVenta };
    } catch (error) {
      console.error('Error updating sale:', error);
      alert('Error al actualizar la venta: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      loadingManager.hide();
    }
  },
  
  eliminarVenta: async function(id) {
    try {
      loadingManager.show();
      
      // Get current sale to return stock
      const { data: venta, error: ventaError } = await supabase
        .from('ventas')
        .select('*')
        .eq('id', parseInt(id))
        .single();
      
      if (ventaError) throw ventaError;
      
      // Return product to stock
      await stockManager.registrarMovimiento(venta.producto_id, 'entrada', venta.cantidad);
      
      // Delete sale from Supabase
      const { error: deleteError } = await supabase
        .from('ventas')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      // Remove from local store (should be updated by subscription, but just in case)
      store.ventas = store.ventas.filter(v => v.id !== parseInt(id));
      
      ui.displayVentas();
      ui.displayFiados();
      return true;
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Error al eliminar la venta: ' + error.message);
      return false;
    } finally {
      loadingManager.hide();
    }
  },
  
  pagarFiado: async function(clienteId, monto) {
    try {
      loadingManager.show();
      
      // Get unpaid 'fiado' sales for this client
      const { data: fiadosPendientes, error: fiadorError } = await supabase
        .from('ventas')
        .select('*')
        .eq('cliente_id', parseInt(clienteId)) // Changed from clienteId to cliente_id
        .eq('fiado', true)
        .eq('pagado', false)
        .order('fecha');
      
      if (fiadorError) throw fiadorError;
      
      let montoRestante = parseFloat(monto);
      const ventasActualizadas = [];
      
      // Pay sales from oldest to newest
      for (const fiado of fiadosPendientes) {
        if (montoRestante >= parseFloat(fiado.total)) {
          // Mark as paid in Supabase
          const { data, error } = await supabase
            .from('ventas')
            .update({ pagado: true })
            .eq('id', fiado.id)
            .select()
            .single();
          
          if (error) throw error;
          
          // Map the response back to our expected format for local store
          const mappedVenta = {
            ...data,
            clienteId: data.cliente_id, // Map back for local store consistency
            productoId: data.producto_id // Map back for local store consistency
          };
          
          ventasActualizadas.push(mappedVenta);
          montoRestante -= parseFloat(fiado.total);
        } else {
          // Can't pay this fiado completely, so leave it for next time
          break;
        }
      }
      
      // Update in local store (should be updated by subscription, but just in case)
      ventasActualizadas.forEach(ventaActualizada => {
        const index = store.ventas.findIndex(v => v.id === ventaActualizada.id);
        if (index !== -1) {
          store.ventas[index] = ventaActualizada;
        }
      });
      
      ui.displayVentas();
      ui.displayFiados();
      
      return { 
        success: true, 
        montoAplicado: parseFloat(monto) - montoRestante,
        ventasActualizadas 
      };
    } catch (error) {
      console.error('Error paying fiado:', error);
      alert('Error al pagar fiado: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      loadingManager.hide();
    }
  },
  
  marcarFiadoPagado: async function(fiadoId) {
    try {
      loadingManager.show();
      
      // Update fiado in Supabase
      const { data, error } = await supabase
        .from('ventas')
        .update({ pagado: true })
        .eq('id', parseInt(fiadoId))
        .eq('fiado', true)
        .eq('pagado', false)
        .select()
        .single();
      
      if (error) throw error;
      
      // Map the response back to our expected format for local store
      const mappedVenta = {
        ...data,
        clienteId: data.cliente_id, // Map back for local store consistency
        productoId: data.producto_id // Map back for local store consistency
      };
      
      // Update in local store (should be updated by subscription, but just in case)
      const index = store.ventas.findIndex(v => v.id === parseInt(fiadoId));
      if (index !== -1) {
        store.ventas[index] = mappedVenta;
      }
      
      ui.displayVentas();
      ui.displayFiados();
      return true;
    } catch (error) {
      console.error('Error marking fiado as paid:', error);
      alert('Error al marcar fiado como pagado: ' + error.message);
      return false;
    } finally {
      loadingManager.hide();
    }
  }
};

const notasManager = {
  crearNota: async function(titulo, contenido) {
    try {
      loadingManager.show();
      
      const newNota = {
        titulo,
        contenido,
        fecha: new Date().toISOString()
      };
      
      // Insert note into Supabase
      const { data: nota, error } = await supabase
        .from('notas')
        .insert([newNota])
        .select()
        .single();
      
      if (error) throw error;
      
      // Add to local store (should be updated by subscription, but just in case)
      store.notas.unshift(nota);
      
      ui.displayNotas();
      return nota;
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Error al crear la nota: ' + error.message);
      return null;
    } finally {
      loadingManager.hide();
    }
  },
  
  editarNota: async function(id, titulo, contenido) {
    try {
      loadingManager.show();
      
      const updateData = {
        titulo,
        contenido,
        fecha: new Date().toISOString() // Update modified date
      };
      
      // Update note in Supabase
      const { data, error } = await supabase
        .from('notas')
        .update(updateData)
        .eq('id', parseInt(id))
        .select()
        .single();
      
      if (error) throw error;
      
      // Update in local store (should be updated by subscription, but just in case)
      const index = store.notas.findIndex(n => n.id === parseInt(id));
      if (index !== -1) {
        store.notas[index] = { ...store.notas[index], ...updateData };
      }
      
      ui.displayNotas();
      return true;
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Error al actualizar la nota: ' + error.message);
      return false;
    } finally {
      loadingManager.hide();
    }
  },
  
  eliminarNota: async function(id) {
    try {
      loadingManager.show();
      
      // Delete note from Supabase
      const { error } = await supabase
        .from('notas')
        .delete()
        .eq('id', parseInt(id));
      
      if (error) throw error;
      
      // Remove from local store (should be updated by subscription, but just in case)
      store.notas = store.notas.filter(n => n.id !== parseInt(id));
      
      ui.displayNotas();
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Error al eliminar la nota: ' + error.message);
      return false;
    } finally {
      loadingManager.hide();
    }
  }
};

// Initialization and Event Handlers
document.addEventListener('DOMContentLoaded', function() {
  // Check for existing session
  if (auth.checkSession()) {
    ui.showMainApp();
  } else {
    ui.showLoginScreen();
  }
  
  // Login event
  document.getElementById('login-btn').addEventListener('click', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (auth.login(username, password)) {
      ui.showMainApp();
    } else {
      alert('Usuario o contraseña incorrectos');
    }
  });
  
  // Logout event
  document.getElementById('logout-btn').addEventListener('click', function() {
    auth.logout();
  });
  
  // Navigation events
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function() {
      const targetSection = this.getAttribute('data-target');
      ui.showSection(targetSection);
      
      // Load section-specific data
      if (targetSection === 'productos-section') {
        ui.displayProductos();
      } else if (targetSection === 'clientes-section') {
        ui.displayClientes();
      } else if (targetSection === 'stock-section') {
        ui.displayStockMovimientos();
      } else if (targetSection === 'ventas-section') {
        ui.displayVentas();
      } else if (targetSection === 'fiados-section') {
        ui.displayFiados();
      } else if (targetSection === 'analisis-section') {
        ui.displayDailyAnalysis();
      } else if (targetSection === 'notas-section') {
        ui.displayNotas();
      }
    });
  });
  
  // Tab events
  document.querySelectorAll('.tabs .tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      ui.showTab(tabId);
      
      if (tabId === 'diario') {
        ui.displayDailyAnalysis();
      } else if (tabId === 'semanal') {
        ui.displayWeeklyAnalysis();
      } else if (tabId === 'mensual') {
        ui.displayMonthlyAnalysis();
      }
    });
  });
  
  // Search functionality
  document.getElementById('search-productos').addEventListener('input', function() {
    ui.filterProductos(this.value);
  });
  
  document.getElementById('search-ventas').addEventListener('input', function() {
    ui.filterVentas(this.value);
  });
  
  // Modal events - Fix the closing functionality
  document.querySelectorAll('.open-modal').forEach(btn => {
    btn.addEventListener('click', function() {
      const modalId = this.getAttribute('data-modal');
      modalManager.openModal(modalId);
    });
  });
  
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function() {
      // Find the closest modal parent
      const modal = this.closest('.modal');
      if (modal) {
        modal.classList.remove('active');
      } else {
        modalManager.closeAllModals();
      }
    });
  });
  
  // Ensure the ESC key can close modals
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      modalManager.closeAllModals();
    }
  });
  
  // Product events
  document.getElementById('agregar-producto-btn').addEventListener('click', async function() {
    const nombre = document.getElementById('producto-nombre').value;
    const precio = document.getElementById('producto-precio').value;
    const stock = document.getElementById('producto-stock').value;
    
    if (nombre && precio && stock) {
      const result = await productosManager.agregarProducto(nombre, precio, stock);
      
      if (result) {
        // Clear form and close modal
        document.getElementById('producto-nombre').value = '';
        document.getElementById('producto-precio').value = '';
        document.getElementById('producto-stock').value = '';
        modalManager.closeAllModals();
        
        // No need to call displayProductos - the subscription will handle it
      }
    } else {
      alert('Todos los campos son requeridos');
    }
  });
  
  document.getElementById('update-producto-btn').addEventListener('click', async function() {
    const id = parseInt(document.getElementById('edit-producto-id').value);
    const nombre = document.getElementById('edit-producto-nombre').value;
    const precio = document.getElementById('edit-producto-precio').value;
    
    if (id && nombre && precio) {
      const success = await productosManager.editarProducto(id, nombre, precio);
      if (success) {
        modalManager.closeAllModals();
      }
    } else {
      alert('Todos los campos son requeridos');
    }
  });
  
  document.getElementById('confirm-delete-producto-btn').addEventListener('click', async function() {
    const id = parseInt(document.getElementById('delete-producto-id').value);
    
    if (id) {
      const success = await productosManager.eliminarProducto(id);
      if (success) {
        modalManager.closeAllModals();
      }
    }
  });
  
  // Client events
  document.getElementById('agregar-cliente-btn').addEventListener('click', async function() {
    const nombre = document.getElementById('cliente-nombre').value;
    const detalles = document.getElementById('cliente-detalles').value;
    
    if (nombre) {
      const result = await clientesManager.agregarCliente(nombre, detalles);
      
      if (result) {
        // Clear form and close modal
        document.getElementById('cliente-nombre').value = '';
        document.getElementById('cliente-detalles').value = '';
        modalManager.closeAllModals();
        
        // No need to call displayClientes - the subscription will handle it
      }
    } else {
      alert('El nombre del cliente es requerido');
    }
  });
  
  document.getElementById('update-cliente-btn').addEventListener('click', async function() {
    const id = parseInt(document.getElementById('edit-cliente-id').value);
    const nombre = document.getElementById('edit-cliente-nombre').value;
    const detalles = document.getElementById('edit-cliente-detalles').value;
    
    if (id && nombre) {
      const success = await clientesManager.editarCliente(id, nombre, detalles);
      if (success) {
        modalManager.closeAllModals();
      }
    } else {
      alert('El nombre del cliente es requerido');
    }
  });
  
  document.getElementById('confirm-delete-cliente-btn').addEventListener('click', async function() {
    const id = parseInt(document.getElementById('delete-cliente-id').value);
    
    if (id) {
      const success = await clientesManager.eliminarCliente(id);
      if (success) {
        modalManager.closeAllModals();
      }
    }
  });
  
  // Stock events
  document.getElementById('actualizar-stock-btn').addEventListener('click', async function() {
    const productoId = document.getElementById('stock-producto-select').value;
    const tipo = document.getElementById('stock-tipo').value;
    const cantidad = document.getElementById('stock-cantidad').value;
    
    if (productoId && cantidad && parseInt(cantidad) > 0) {
      const result = await stockManager.registrarMovimiento(parseInt(productoId), tipo, cantidad);
      
      if (result) {
        // Clear form and close modal
        document.getElementById('stock-producto-select').value = '';
        document.getElementById('stock-cantidad').value = '';
        modalManager.closeAllModals();
        
        // No need to call displayStockMovimientos - the subscription will handle it
      }
    } else {
      alert('Seleccione un producto y especifique una cantidad válida');
    }
  });
  
  // Fiado switch events
  document.getElementById('venta-fiado').addEventListener('change', function() {
    ui.updateFiadoStatus(this.checked);
  });
  
  document.getElementById('edit-venta-fiado').addEventListener('change', function() {
    ui.updateEditFiadoStatus(this.checked);
  });
  
  // Sales events
  document.getElementById('agregar-venta-btn').addEventListener('click', async function() {
    const clienteId = ui.clienteAutocomplete.getValue();
    const productoId = ui.productoAutocomplete.getValue();
    const cantidad = document.getElementById('venta-cantidad').value;
    const esFiado = document.getElementById('venta-fiado').checked;
    const notas = document.getElementById('venta-notas').value;
    
    if (clienteId && productoId && cantidad && parseInt(cantidad) > 0) {
      const result = await ventasManager.registrarVenta(clienteId, productoId, cantidad, esFiado, notas);
      
      if (result.success) {
        // Clear form and close modal
        ui.clienteAutocomplete.clear();
        ui.productoAutocomplete.clear();
        document.getElementById('venta-cantidad').value = '';
        document.getElementById('venta-fiado').checked = false;
        document.getElementById('venta-notas').value = '';
        document.getElementById('venta-producto-stock-container').classList.add('hidden');
        ui.updateFiadoStatus(false);
        modalManager.closeAllModals();
        
        // No need to call displayVentas - the subscription will handle it
      } else {
        alert(result.error);
      }
    } else {
      alert('Todos los campos son requeridos');
    }
  });
  
  // Edit Sale events
  document.getElementById('update-venta-btn').addEventListener('click', async function() {
    const id = parseInt(document.getElementById('edit-venta-id').value);
    const clienteId = ui.editClienteAutocomplete.getValue();
    const productoId = ui.editProductoAutocomplete.getValue();
    const cantidad = document.getElementById('edit-venta-cantidad').value;
    const esFiado = document.getElementById('edit-venta-fiado').checked;
    const notas = document.getElementById('edit-venta-notas').value;
    
    if (id && clienteId && productoId && cantidad && parseInt(cantidad) > 0) {
      const result = await ventasManager.editarVenta(id, clienteId, productoId, cantidad, esFiado, notas);
      
      if (result.success) {
        modalManager.closeAllModals();
      } else {
        alert(result.error);
      }
    } else {
      alert('Todos los campos son requeridos');
    }
  });
  
  // Delete Sale events
  document.getElementById('confirm-delete-venta-btn').addEventListener('click', async function() {
    const id = parseInt(document.getElementById('delete-venta-id').value);
    
    if (id) {
      const success = await ventasManager.eliminarVenta(id);
      if (success) {
        modalManager.closeAllModals();
      }
    }
  });
  
  // Fiado events
  document.getElementById('fiado-cliente-select').addEventListener('change', function() {
    ui.updateFiadoDetails(this.value);
  });
  
  document.getElementById('pagar-fiado-btn').addEventListener('click', async function() {
    const clienteId = document.getElementById('fiado-cliente-select').value;
    const monto = document.getElementById('fiado-monto-pago').value;
    
    if (clienteId && monto && parseFloat(monto) > 0) {
      const result = await ventasManager.pagarFiado(clienteId, monto);
      
      if (result.success) {
        // Update fiado details
        ui.updateFiadoDetails(clienteId);
        document.getElementById('fiado-monto-pago').value = '';
        modalManager.closeAllModals();
      }
    } else {
      alert('Seleccione un cliente y especifique un monto válido');
    }
  });
  
  document.getElementById('confirm-mark-paid-btn').addEventListener('click', async function() {
    const fiadoId = document.getElementById('fiado-id-to-mark').value;
    
    if (fiadoId) {
      const success = await ventasManager.marcarFiadoPagado(parseInt(fiadoId));
      if (success) {
        modalManager.closeAllModals();
      }
    }
  });
  
  // Analysis events
  document.getElementById('analisis-cliente-select').addEventListener('change', function() {
    ui.displayClientAnalysis(this.value);
  });
  
  // Notas events
  document.getElementById('crear-nota-btn').addEventListener('click', async function() {
    const titulo = document.getElementById('nota-titulo').value;
    const contenido = document.getElementById('nota-contenido').value;
    
    if (titulo && contenido) {
      const result = await notasManager.crearNota(titulo, contenido);
      
      if (result) {
        // Clear form and close modal
        document.getElementById('nota-titulo').value = '';
        document.getElementById('nota-contenido').value = '';
        modalManager.closeAllModals();
        
        // No need to call displayNotas - the subscription will handle it
      }
    } else {
      alert('El título y el contenido son requeridos');
    }
  });
  
  document.getElementById('update-nota-btn').addEventListener('click', async function() {
    const id = parseInt(document.getElementById('edit-nota-id').value);
    const titulo = document.getElementById('edit-nota-titulo').value;
    const contenido = document.getElementById('edit-nota-contenido').value;
    
    if (id && titulo && contenido) {
      const success = await notasManager.editarNota(id, titulo, contenido);
      if (success) {
        modalManager.closeAllModals();
      }
    } else {
      alert('El título y el contenido son requeridos');
    }
  });
  
  document.getElementById('confirm-delete-nota-btn').addEventListener('click', async function() {
    const id = parseInt(document.getElementById('delete-nota-id').value);
    
    if (id) {
      const success = await notasManager.eliminarNota(id);
      if (success) {
        modalManager.closeAllModals();
      }
    }
  });
  
  // Event delegation for dynamic elements
  document.addEventListener('click', function(e) {
    // Edit product button
    if (e.target.closest('.edit-producto')) {
      const productId = parseInt(e.target.closest('.edit-producto').getAttribute('data-id'));
      const producto = store.productos.find(p => p.id === productId);
      
      if (producto) {
        document.getElementById('edit-producto-id').value = producto.id;
        document.getElementById('edit-producto-nombre').value = producto.nombre;
        document.getElementById('edit-producto-precio').value = producto.precio;
        
        modalManager.openModal('edit-producto-modal');
      }
    }
    
    // Delete product button
    if (e.target.closest('.delete-producto')) {
      const productId = parseInt(e.target.closest('.delete-producto').getAttribute('data-id'));
      document.getElementById('delete-producto-id').value = productId;
      modalManager.openModal('delete-producto-modal');
    }
    
    // Edit client button
    if (e.target.closest('.edit-cliente')) {
      const clientId = parseInt(e.target.closest('.edit-cliente').getAttribute('data-id'));
      const cliente = store.clientes.find(c => c.id === clientId);
      
      if (cliente) {
        document.getElementById('edit-cliente-id').value = cliente.id;
        document.getElementById('edit-cliente-nombre').value = cliente.nombre;
        document.getElementById('edit-cliente-detalles').value = cliente.detalles || '';
        
        modalManager.openModal('edit-cliente-modal');
      }
    }
    
    // Delete client button
    if (e.target.closest('.delete-cliente')) {
      const clientId = parseInt(e.target.closest('.delete-cliente').getAttribute('data-id'));
      document.getElementById('delete-cliente-id').value = clientId;
      modalManager.openModal('delete-cliente-modal');
    }
    
    // Edit sale button
    if (e.target.closest('.edit-venta')) {
      const ventaId = parseInt(e.target.closest('.edit-venta').getAttribute('data-id'));
      const venta = store.ventas.find(v => v.id === ventaId);
      
      if (venta) {
        document.getElementById('edit-venta-id').value = venta.id;
        
        // Set selected values in autocompletes
        const cliente = store.clientes.find(c => c.id === venta.clienteId);
        const producto = store.productos.find(p => p.id === venta.productoId);
        
        if (cliente && ui.editClienteAutocomplete) {
          ui.editClienteAutocomplete.setValue(cliente.id.toString(), cliente.nombre);
        }
        
        if (producto && ui.editProductoAutocomplete) {
          ui.editProductoAutocomplete.setValue(producto.id.toString(), producto.nombre);
          document.getElementById('edit-venta-producto-stock').textContent = producto.stock;
          document.getElementById('edit-venta-producto-stock-container').classList.remove('hidden');
        }
        
        document.getElementById('edit-venta-cantidad').value = venta.cantidad;
        document.getElementById('edit-venta-fiado').checked = venta.fiado;
        document.getElementById('edit-venta-notas').value = venta.notas || '';
        
        ui.updateEditFiadoStatus(venta.fiado);
        
        modalManager.openModal('edit-venta-modal');
      }
    }
    
    // Delete sale button
    if (e.target.closest('.delete-venta')) {
      const ventaId = parseInt(e.target.closest('.delete-venta').getAttribute('data-id'));
      document.getElementById('delete-venta-id').value = ventaId;
      modalManager.openModal('delete-venta-modal');
    }
    
    // Mark fiado as paid button
    if (e.target.closest('.mark-fiado-paid')) {
      const fiadoId = parseInt(e.target.closest('.mark-fiado-paid').getAttribute('data-id'));
      document.getElementById('fiado-id-to-mark').value = fiadoId;
      modalManager.openModal('mark-fiado-paid-modal');
    }
    
    // Edit note button
    if (e.target.closest('.edit-nota')) {
      const notaId = parseInt(e.target.closest('.edit-nota').getAttribute('data-id'));
      const nota = store.notas.find(n => n.id === notaId);
      
      if (nota) {
        document.getElementById('edit-nota-id').value = nota.id;
        document.getElementById('edit-nota-titulo').value = nota.titulo;
        document.getElementById('edit-nota-contenido').value = nota.contenido;
        
        modalManager.openModal('edit-nota-modal');
      }
    }
    
    // Delete note button
    if (e.target.closest('.delete-nota')) {
      const notaId = parseInt(e.target.closest('.delete-nota').getAttribute('data-id'));
      document.getElementById('delete-nota-id').value = notaId;
      modalManager.openModal('delete-nota-modal');
    }
  });
  
  // Initialize UI with default section
  ui.showLoginScreen();
});