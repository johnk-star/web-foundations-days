const loadBtn = document.getElementById('load-users');
const filterInput = document.getElementById('filter-input');
const statusText = document.getElementById('status');
const usersList = document.getElementById('users-list');

// Array to store the fetched users so we can filter them without re-fetching
let usersArray = [];

async function loadUsers() {
    try {
        // Disable button and show loading text
        loadBtn.disabled = true;
        statusText.textContent = "Loading users...";
        statusText.className = "";
        
        // Fetch data from the API
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        usersArray = await response.json();
        
        statusText.textContent = "Users loaded successfully!";
        renderUsers(usersArray);

    } catch (error) {
        statusText.textContent = "Error loading users. Please try again later.";
        statusText.className = "error";
        console.error("Fetch error: ", error);
    } finally {
        // Re-enable button after request finishes (success or fail)
        loadBtn.disabled = false;
    }
}

function renderUsers(list) {
    usersList.innerHTML = ''; // Clear current list

    if (list.length === 0) {
        usersList.innerHTML = '<li>No users match your filter.</li>';
        return;
    }

    list.forEach(user => {
        const li = document.createElement('li');
        li.className = 'user-card';

        const nameEl = document.createElement('h3');
        nameEl.textContent = user.name;
        nameEl.style.margin = "0 0 5px 0";

        const detailsEl = document.createElement('p');
        detailsEl.style.margin = "0";
        detailsEl.textContent = `Email: ${user.email} | City: ${user.address.city} | Company: ${user.company.name}`;

        li.appendChild(nameEl);
        li.appendChild(detailsEl);
        usersList.appendChild(li);
    });
}

// Listen for the input event on the filter box
filterInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    // Filter the stored array
    const filteredUsers = usersArray.filter(user => 
        user.name.toLowerCase().includes(searchTerm)
    );
    
    renderUsers(filteredUsers);
});

// Attach event listener to the button
loadBtn.addEventListener('click', loadUsers);