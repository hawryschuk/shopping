# Point of Sale System
- Alex Hawryschuk, 2021-05-07

# Introduction
This application serves to broker the exchange between buyer and seller. Sellers publish their store information and buyers peruse the stores, their menus, and purchase the inventory.

<hr style="page-break-before: always"></hr>

# TOC

<hr style="page-break-before: always"></hr>

# Functional Requirements
* Sign Up: First time visitors can sign up and immediately login
* Log In
- User role based access
    * Buyer:
        - View Stores
        - View Store Menu Items
        - View My Purchases
        - Create Purchase Order
    * StoreOwner:
        - Add Store
        - View My Stores
        - View Incoming Orders
        - Finish Incoming Order
        - Cancel Incoming Order
        - Replenish Inventory        
    * Admin:
        - View Users
- View Stores will be displayed:
    * sorted by distance
- Store Details will display:
    * distance
    * top selling product
    * least selling product
    * menu items ordered by most recently modified
- A Menu Item will display:
    * name
    * price
    * photo
    * description
    * number of units sold
    * number of units in inventory 

<hr style="page-break-before: always"></hr>

# Technical Requirements
- A REST API that can perform all of the features above
- The REST API will authenticate the user and authorize the access

# Development Plan
```mermaid
    gantt
        dateFormat YYYY-MM-DD

        section Requirements
            Spec Writing                    :2021-04-03, 1d
            
        section Design
            Use Cases                       :2021-04-03, 1d
            Domain Model                    :2021-04-04, 1d
            URL Structure FB                :2021-04-04, 1d

        section Communications
            Introduction                    :2021-04-05, 1d
            Clarification                   :2021-04-05, 1d
        
        section Implementation - MVC
            Business Model                  :2021-04-05, 1d
            Server                          :2021-04-05, 2d
            Client_BW                       :2021-04-07, 2d
            Wireframes                      :2021-04-08, 2d
            E2E                             :2021-04-08, 2d
            Client_Colour                   :2021-04-10, 1d

        section Documentation
            Refactoring                     :2021-04-10, 1d
            User Docs                       :2021-04-10, 1d
            Deploy /docs                    :2021-04-11, 1d

        section Presentation
            Presentation                    :2021-04-12, 1d

        section Implementation - Production
            Model Validation                :2021-04-13, 2d
            Loading+Error                   :2021-04-13, 2d
            Security                        :2021-04-13, 2d
            E2E Edge Cases                  :2021-04-15, 2d
            Cloud Services                  :2021-04-15, 2d
            Cleanup                         :2021-04-15, 2d

```

<hr style="page-break-before: always"></hr>

# Design
## Use Cases
```mermaid
    graph LR
        subgraph Actors
            User
        end

        subgraph _Shopper_
            User --- View_Purchases & View_Stores
                View_Stores  --- View_cart & View_Store
                    View_Store --- Add_Items_to_cart
                    View_cart --- Checkout
        end

        subgraph Administrator
            User --- View_Users --- Edit_User & Delete_User
        end

        subgraph _Any_User_
            User --- Signup & Signin
        end
        

        subgraph _StoreOwner_
            User --- View_My_Stores --- Add_Store & View_Store2
                View_Store2 --- Add_menu_item & Delete_menu_item & Update_menu_item & Replenish_Inventory
            User --- ViewPurchases --- CancelPurchase & CompletePurchase
        end
        
```

<hr style="page-break-before: always"></hr>

## REST API
```mermaid
    graph LR
            / --- auth & API_signup(signup) & API_USER(User) & API_STORE(Store) & Purchase
                API_USER -.- :user_id
                API_STORE -.- :store_id -.- menu & purchase
                Purchase -.- :purchase_id

```

<hr style="page-break-before: always"></hr>

## Business Model
```mermaid
    classDiagram
        class StoreSystem {
            signup(user)
            login(username,password)
            authenticate(username,password)
            purchase(order)
            replenish(inventory)
            
            get(user | store)
            put(user | store)
            delete(user | store)
            post(user | store)
        }
        
        StoreSystem     *-- User
            StoreSystem *-- Store
        
        Purchase o-- CartItem

        class Purchase {
            date
            shopper_id
            store_id
            shipping_details
            items
        }

        class InventoryPurchase {
            menuitem
            quantity
            date
        }
        
        Shopper            --|> User
            Admin           --|> User
            StoreOwner    --|> User

        Store *-- MenuItem
        Store *-- InventoryPurchase
        Store *-- Purchase
        Shopper o-- Purchase

        Store --* StoreOwner

        class Cart { 
            items
        }

        class MenuItem {
            name
            description
            photo
            price
            inventory
        }

        class Shopper {
            purchases
            cart
        }

        Shopper *-- Cart
        Cart *-- CartItem
        CartItem -- MenuItem
        
        class CartItem {
            menuitem
            quantity
        }

        class User {
            string email
            string password
            string name
            date created
            string category 
        }

        class Admin {
        }
        
        class StoreOwner {

        }
        
        class Store {
            string name
            string address
            StoreOwner owner
            Purchase[] purchases
            InventoryPurchase[] inventoryPurchases
            pendingOrders()         
            completedOrders()
        }
        
```

<hr style="page-break-before: always"></hr>

## Logical Design
```mermaid
    classDiagram
        class DAO { }
            MemoryDAO --|> DAO
            RestDAO  --|> DAO
            SQL_DAO --|> DAO
            DAO *-- Model
            DomainApplication *-- DAO

        RestApplication --|> DomainApplication

        RestApplication *-- RestDAO

        WebServer *-- DomainApplication

        WebClient *-- DomainApplication
        ApplicationTester *-- DomainApplication

        WebClient --|> Process
        WebServer --|> Process
        ApplicationTester --|> Process

```

<hr style="page-break-before: always"></hr>

## UI Design

### UI Components
```mermaid
    graph TB
        LandingPage -->  SignUp -.- StoreOwner & Shopper
        
        LandingPage -.- SignIn --> OwnerLanding & RegularLanding & AdminLanding
            
            RegularLanding -.- MyPurchases -.- ViewPurchase
            RegularLanding -.- ViewStores -.- ViewStoreDetails -.- ViewShoppingCart -.- CheckOut
            
            OwnerLanding -.- Dashboard2
            OwnerLanding -.- MyStores -.- CreateStore & ViewStore2
                ViewStore2 -.- AddMenuItem & AddInventory & ViewPurchases
                    ViewPurchases -.- CancelPurchase & CompletePurchase

            AdminLanding -.- Dashboard & DisplayUsers & DisplayStores
                DisplayUsers -.- ModifyUser
                DisplayStores -.- ModifyStore

```

<hr style="page-break-before: always"></hr>

## Physical Design
```mermaid
graph LR

    subgraph Sources
        Node --> Typescript --> Express & Angular & Mocha & AWS
    end
    
    subgraph User
        Developer & Shopper & StoreOwner & Admin
    end

    subgraph Application
        WebClient & WebServer 
        DevTools
        subgraph Client Server Arch
            WebClient & WebServer & DbServer
        end
    end
    
    Express --> WebServer
    Angular --> WebClient
    Mocha --> DevTools
    AWS --> DbServer
    
    DevTools --> Developer
    WebClient --> Shopper & StoreOwner & Admin
```

<hr style="page-break-before: always"></hr>

# DevOps

## Directory Structure
- business-model
- frontend-angular
- backend-server
    - backend-client
- abstract
    - common
    - dao
        - sqlite
        - cloud:*

<hr style="page-break-before: always"></hr>

## Development Processes
```mermaid
graph TD
    subgraph user-docs
        docs
    end

    client:e2e & client:e2e:test-server -->|updates| docs

    subgraph e2e
        client:e2e:test-server & server:test-server
    end

    subgraph coding
        client:write-code
        model:write-code
        server:write-code
    end

    subgraph business-layer
        model:start-dev -->|auto-tests| model:start-dev --> model:write-code
    end
    
    subgraph backend-layer
        server:start -->|auto-tests rest-api server | server:start
        server:start -->server:write-code --> server:run-test-server --> server:test-server
        server:run-test-server -->|auto-restarts localhost:8002| server:run-test-server
        server:test-server -->|auto-tests rest-api-client| server:test-server
    end
    
    subgraph presentation-layer
        client:start -->|auto-restarts| client:start
        client:e2e -->|memory| client:e2e
        client:e2e:test-server -->|rest-api| client:e2e:test-server
        client:start --> client:write-code --> client:e2e -->client:e2e:test-server
    end
    
```
<hr style="page-break-before: always"></hr>

## Questions for Buyer
- Would you like to have graphic design work done? Do you have a logo or colour scheme?
- Where does the shopper and their purchases go when the user is deleted?

## Standard Features Added
- Model validations
- Security
- Further error handling in the UI
    - Present backend errors
    - Present backend delays
    - Present model invalidations

## Suggested Improvements
- Frontend
    - Email verification
    - Reset password
- Dev Process
    - Linting in the development processes
    - Semantic Release in the CI : Update the changelog automatically
- Backend
    - Choosing a hosting provider
        - IE: AWS w/ RDBMS|DynamoDB|S3
        - IE: Azure w/ CosmosDB
        - IE: Docker with Express/Mongo
        - IE: Server Host with Mysql
    - repository for npm packages
    - repository for build artifacts

## TODO
- Consult with buyer to negotiate further milestones and agile iterations

<hr style="page-break-before: always"></hr>

# Edge Case Tests
- admin cannot delete self account
- admin edit user with no name
- sign up with bad email
- sign up with no password
- non admins can not delete or edit users, stores, purchases
- create store with no name
- send an expired token
- server is down
- server responds slowly

# sections that go into a README
- The scope and functionality.
- Directory structure.
- Instructions to get it up and running.
- The solution approach, and a brief story about it.
- Difficulties you encountered and how you tackle them.
- Performance and space requirements of the solution.
- List of dependencies
- List of supported browsers/platforms.
- Next steps to improve the solution.
