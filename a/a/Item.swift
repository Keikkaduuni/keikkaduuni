//
//  Item.swift
//  a
//
//  Created by Miro Vesterinen on 27.5.2025.
//

import Foundation
import SwiftData

@Model
final class Item {
    var timestamp: Date
    
    init(timestamp: Date) {
        self.timestamp = timestamp
    }
}
