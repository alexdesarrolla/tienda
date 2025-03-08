// Cart functionality
document.addEventListener('DOMContentLoaded', function() {
    // Cart toggle
    const cartToggle = document.getElementById('cart-toggle');
    const cartModal = document.getElementById('cart-modal');
    const cartBackdrop = document.getElementById('cart-backdrop');
    const cartClose = document.getElementById('cart-close');
    
    // Open cart
    cartToggle.addEventListener('click', function() {
      cartModal.classList.add('active');
      cartBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent scrolling when cart is open
    });
    
    // Close cart
    function closeCart() {
      cartModal.classList.remove('active');
      cartBackdrop.classList.remove('active');
      document.body.style.overflow = ''; // Restore scrolling
    }
    
    cartClose.addEventListener('click', closeCart);
    cartBackdrop.addEventListener('click', closeCart);
    
    // Close cart with ESC key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && cartModal.classList.contains('active')) {
        closeCart();
      }
    });
    
    // Show toast notification when adding to cart
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
      button.addEventListener('click', function() {
        // The cart.addItem() function is already being called in your existing code
        
        // Create and show toast notification
        const toast = document.createElement('div');
        toast.className = 'cart-toast';
        toast.innerHTML = '<i class="fas fa-check-circle"></i> Producto añadido al carrito';
        document.body.appendChild(toast);
        
        // Remove toast after animation completes
        setTimeout(() => {
          toast.remove();
        }, 2000);
      });
    });
  });